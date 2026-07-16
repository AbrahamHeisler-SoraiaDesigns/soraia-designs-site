import {
  ACTIVE_NURTURE_STATUSES,
  EMAIL_KEYS,
  TERMINAL_LEAD_STATUSES,
  TERMINAL_NURTURE_STATUSES,
} from './audit-config.js'
import { buildEmailContent, daysSince, htmlToText, isoNow } from './audit-utils.js'
import { upsertBrevoContact } from './brevo.js'
import { sendGmailAs, hasRecentInboundFrom, isDryRun } from './gmail.js'
import { findContactByEmail, updateContact } from './hubspot.js'

export function contactIsSuppressed(contact) {
  // Test rows never receive a nurture send. Mirrors the #55 audit-watcher guard
  // (soraia_audit_hubspot_poller.py): HubSpot returns the boolean as the string
  // "true". One property (audit_test) now cleans both lanes — no watcher
  // generation AND no sequencer send — for the test:* contacts.
  if (contact.audit_test === 'true') return true
  return TERMINAL_LEAD_STATUSES.has(contact.hs_lead_status || '') || TERMINAL_NURTURE_STATUSES.has(contact.audit_nurture_status || '')
}

export function nextEmailKey(contact) {
  if (contactIsSuppressed(contact)) return null

  const nurtureStatus = contact.audit_nurture_status || 'not_enrolled'
  if (!ACTIVE_NURTURE_STATUSES.has(nurtureStatus)) return null

  const lastKey = contact.audit_last_email_key || ''
  const since = daysSince(contact.audit_last_email_sent_at)
  const auditDelivered = contact.audit_status === 'delivered' && !!contact.audit_pdf_url

  if (!lastKey) return EMAIL_KEYS.EMAIL_1
  if (lastKey === EMAIL_KEYS.EMAIL_1 && auditDelivered) return EMAIL_KEYS.EMAIL_2
  if (lastKey === EMAIL_KEYS.EMAIL_2 && since >= 2) return EMAIL_KEYS.EMAIL_3
  if (lastKey === EMAIL_KEYS.EMAIL_3 && since >= 2) return EMAIL_KEYS.EMAIL_4
  if (lastKey === EMAIL_KEYS.EMAIL_4 && since >= 5) return EMAIL_KEYS.EMAIL_5
  // Drop-off recovery: Email 5 + 14d, then + 16d (= Email 5 + 30d). Suppressed on booking/reply.
  if (lastKey === EMAIL_KEYS.EMAIL_5 && since >= 14) return EMAIL_KEYS.RECOVERY_1
  if (lastKey === EMAIL_KEYS.RECOVERY_1 && since >= 16) return EMAIL_KEYS.RECOVERY_2
  return null
}

export async function sendNurtureEmail(contact, emailKey) {
  const freshContact = await findContactByEmail(contact.email)
  if (!freshContact?.id) {
    return { ok: false, skipped: true, reason: 'contact_not_found' }
  }

  // Idempotency: don't re-send the same step inside a tight window.
  const duplicateWindowDays = 20 / 1440
  const alreadySentThisStep = freshContact.audit_last_email_key === emailKey && daysSince(freshContact.audit_last_email_sent_at) < duplicateWindowDays
  if (alreadySentThisStep) {
    return { ok: true, skipped: true, reason: 'duplicate_recent_send' }
  }

  // The sequence must still expect exactly this step.
  const expectedNextEmail = nextEmailKey(freshContact)
  if (expectedNextEmail !== emailKey) {
    return { ok: true, skipped: true, reason: 'sequence_state_changed', expectedNextEmail }
  }

  const email = buildEmailContent(emailKey, freshContact)
  const text = htmlToText(email.html) // plain-text render (doc 14 spam-fingerprint finding)

  // DRY_RUN: produce the send-plan and STOP — NO external calls of any kind (no
  // Gmail reply-check, no Brevo upsert, no send). A true side-effect-free plan for
  // Maya to QA per email key before the first live run. The reply-gate below is a
  // live-send safety, applied when a real send actually fires.
  if (isDryRun()) {
    return { ok: true, dryRun: true, emailKey, to: freshContact.email, subject: email.subject, text }
  }

  // Reply-aware pre-send gate (build-spec §4 / doc 15 §C) — LIVE path only. A
  // manual pause, or ANY inbound reply from the lead, stops the send — this is
  // what makes the Esther collision (goodbye → cold re-pitch) structurally
  // impossible. CALL_BOOKED / terminal states are filtered upstream by nextEmailKey.
  if (freshContact.audit_nurture_status === 'paused_manual') {
    return { ok: true, skipped: true, reason: 'paused_manual' }
  }
  try {
    if (await hasRecentInboundFrom(freshContact.email)) {
      await updateContact(freshContact.id, {
        audit_nurture_status: 'paused_reply',
        audit_brevo_last_sync_at: isoNow(),
      })
      return { ok: true, skipped: true, reason: 'lead_replied' }
    }
  } catch (error) {
    // Fail CLOSED: better to skip a send than risk mailing a lead who already
    // replied. The next cron run retries the check.
    console.error('reply_check_failed_skip', emailKey, String(error))
    return { ok: false, skipped: true, reason: 'reply_check_failed' }
  }

  // Keep the Brevo CONTACT in sync (segmentation + verified fallback), but Brevo
  // must NOT send — Gmail is the only sender (Maya port condition #3). Upsert only.
  let brevoUpsertError = null
  try {
    await upsertBrevoContact(freshContact)
  } catch (error) {
    brevoUpsertError = error
  }

  // Send as abe@ via Gmail. Reply-To is intentionally omitted so replies land on
  // From (abe@) — the exact mailbox hasRecentInboundFrom polls, so the reply gate
  // can actually see them (hello@ also forwards to abe@). Throws on any non-2xx →
  // no flags written below.
  let sendResult
  try {
    sendResult = await sendGmailAs({
      to: freshContact.email,
      subject: email.subject,
      text,
    })
  } catch (error) {
    await updateContact(freshContact.id, {
      audit_brevo_sync_status: 'errored',
      audit_brevo_last_sync_at: isoNow(),
    })
    throw error
  }

  // FLAG-ON-SUCCESS (the flag-lies fix): write the send flags ONLY now that Gmail
  // returned a real message id. Because a failed send throws above and never
  // reaches here, a non-send can no longer record itself as sent.
  const nextNurtureStatus = emailKey === EMAIL_KEYS.RECOVERY_2 ? 'completed' : 'active'
  const sentAt = isoNow()
  const props = {
    audit_last_email_key: emailKey,
    audit_last_email_sent_at: sentAt,
    audit_nurture_status: nextNurtureStatus,
    audit_brevo_sync_status: brevoUpsertError ? 'errored' : 'synced',
    audit_brevo_last_sync_at: sentAt,
  }
  if (emailKey === EMAIL_KEYS.EMAIL_5 || emailKey === EMAIL_KEYS.RECOVERY_2) props.hs_lead_status = 'NURTURE_FATIGUED'
  await updateContact(freshContact.id, props)
  return { ok: true, emailKey, messageId: sendResult.messageId }
}

export async function syncLeadToBrevoAndMark(contact, initialEmailKey = EMAIL_KEYS.EMAIL_1) {
  await upsertBrevoContact(contact)
  await updateContact(contact.id, {
    audit_brevo_sync_status: 'synced',
    audit_brevo_last_sync_at: isoNow(),
    audit_nurture_status: 'active',
  })

  const isInitialConfirmation = initialEmailKey === EMAIL_KEYS.EMAIL_1
  const sentRecently = !!contact.audit_last_email_sent_at && daysSince(contact.audit_last_email_sent_at) < 90
  if (sentRecently && !isInitialConfirmation) {
    return { ok: true, skipped: true, reason: 'suppressed_recent_sequence' }
  }

  return sendNurtureEmail(contact, initialEmailKey)
}
