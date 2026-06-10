import {
  ACTIVE_NURTURE_STATUSES,
  EMAIL_KEYS,
  TERMINAL_LEAD_STATUSES,
  TERMINAL_NURTURE_STATUSES,
} from './audit-config.js'
import { buildEmailContent, daysSince, firstName, isoNow } from './audit-utils.js'
import { sendBrevoEmail, sendResendEmail, upsertBrevoContact } from './brevo.js'
import { findContactByEmail, updateContact } from './hubspot.js'

export function contactIsSuppressed(contact) {
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

  const duplicateWindowDays = 20 / 1440
  const alreadySentThisStep = freshContact.audit_last_email_key === emailKey && daysSince(freshContact.audit_last_email_sent_at) < duplicateWindowDays
  if (alreadySentThisStep) {
    return { ok: true, skipped: true, reason: 'duplicate_recent_send' }
  }

  const expectedNextEmail = nextEmailKey(freshContact)
  if (expectedNextEmail !== emailKey) {
    return { ok: true, skipped: true, reason: 'sequence_state_changed', expectedNextEmail }
  }

  // Stay 'active' through the recovery layer; only the final recovery touch completes the nurture.
  const nextNurtureStatus = emailKey === EMAIL_KEYS.RECOVERY_2 ? 'completed' : 'active'
  const claimTime = isoNow()
  await updateContact(freshContact.id, {
    // HubSpot allowed values: pending, synced, suppressed, errored
    // Use `pending` while the send is in flight; `sending` is not a valid enum option.
    audit_brevo_sync_status: 'pending',
    audit_brevo_last_sync_at: claimTime,
    audit_nurture_status: nextNurtureStatus,
    audit_last_email_key: emailKey,
    audit_last_email_sent_at: claimTime,
  })

  const contactForSend = {
    ...freshContact,
    audit_nurture_status: nextNurtureStatus,
    audit_last_email_key: emailKey,
    audit_last_email_sent_at: claimTime,
  }
  const email = buildEmailContent(emailKey, contactForSend)
  let brevoUpsertError = null

  try {
    try {
      await upsertBrevoContact(contactForSend)
    } catch (error) {
      brevoUpsertError = error
    }

    if (emailKey === EMAIL_KEYS.EMAIL_1) {
      await sendResendEmail({
        toEmail: freshContact.email,
        subject: email.subject,
        html: email.html,
      })
    } else {
      try {
        await sendBrevoEmail({
          toEmail: freshContact.email,
          toName: firstName(contactForSend),
          subject: email.subject,
          html: email.html,
          previewText: email.previewText,
        })
      } catch (brevoSendError) {
        // Brevo unavailable (e.g. key/config). Fall back to the proven Resend path so the
        // sequence still delivers; surface the Brevo failure for follow-up without blocking the send.
        console.error('brevo_send_failed_fallback_resend', emailKey, String(brevoSendError))
        await sendResendEmail({
          toEmail: freshContact.email,
          subject: email.subject,
          html: email.html,
        })
      }
    }
  } catch (error) {
    await updateContact(freshContact.id, {
      audit_brevo_sync_status: 'errored',
      audit_brevo_last_sync_at: isoNow(),
      audit_nurture_status: freshContact.audit_nurture_status || 'active',
      audit_last_email_key: freshContact.audit_last_email_key || '',
      audit_last_email_sent_at: freshContact.audit_last_email_sent_at || '',
    })
    throw error
  }

  const props = {
    audit_brevo_sync_status: brevoUpsertError ? 'errored' : 'synced',
    audit_brevo_last_sync_at: isoNow(),
    audit_nurture_status: nextNurtureStatus,
    audit_last_email_key: emailKey,
    audit_last_email_sent_at: claimTime,
  }
  if (emailKey === EMAIL_KEYS.EMAIL_5 || emailKey === EMAIL_KEYS.RECOVERY_2) props.hs_lead_status = 'NURTURE_FATIGUED'
  await updateContact(freshContact.id, props)
  return { ok: true, emailKey }
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
