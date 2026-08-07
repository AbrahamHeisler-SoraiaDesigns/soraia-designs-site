import {
  ACTIVE_NURTURE_STATUSES,
  DELIVERY_BLOCKING_LEAD_STATUSES,
  DELIVERY_BLOCKING_NURTURE_STATUSES,
  EMAIL_KEYS,
  findEngagedDeal,
  NEW_LEAD_DEAL_STAGE_ID,
  reengageHoldActive,
  reengageIsDue,
  SOFT_PAUSE_NURTURE_STATUSES,
  TERMINAL_LEAD_STATUSES,
  TERMINAL_NURTURE_STATUSES,
} from './audit-config.js'
import { buildEmailContent, daysSince, htmlToText, isoNow } from './audit-utils.js'
import { upsertBrevoContact } from './brevo.js'
import { sendGmailAs, hasRecentInboundFrom, isDryRun } from './gmail.js'
import { findContactByEmail, getAssociatedDealStages, updateContact } from './hubspot.js'

// The deal stages that keep a contact mailable: the New Lead id AND the stage that
// fresh "- Audit" deals are actually created in. Coupling these two closes the
// failure mode where a hardcoded-constant/env drift would flag every brand-new
// lead's own deal as "engaged" and silently stall the whole ladder past EMAIL_1.
const NON_ENGAGING_DEAL_STAGES = [NEW_LEAD_DEAL_STAGE_ID, process.env.HUBSPOT_AUDIT_DEAL_STAGE_ID].filter(Boolean)
if (
  process.env.HUBSPOT_AUDIT_DEAL_STAGE_ID &&
  process.env.HUBSPOT_AUDIT_DEAL_STAGE_ID !== NEW_LEAD_DEAL_STAGE_ID
) {
  console.warn(
    `[nurture] HUBSPOT_AUDIT_DEAL_STAGE_ID (${process.env.HUBSPOT_AUDIT_DEAL_STAGE_ID}) != NEW_LEAD_DEAL_STAGE_ID ` +
      `(${NEW_LEAD_DEAL_STAGE_ID}) — deal-stage gate treats BOTH as New Lead; reconcile if the pipeline changed.`,
  )
}

export function contactIsSuppressed(contact) {
  // Test rows never receive a nurture send. Mirrors the #55 audit-watcher guard
  // (soraia_audit_hubspot_poller.py): HubSpot returns the boolean as the string
  // "true". One property (audit_test) now cleans both lanes — no watcher
  // generation AND no sequencer send — for the test:* contacts.
  if (contact.audit_test === 'true') return true
  return TERMINAL_LEAD_STATUSES.has(contact.hs_lead_status || '') || TERMINAL_NURTURE_STATUSES.has(contact.audit_nurture_status || '')
}

// Can we send the AUDIT ITSELF to this contact? Deliberately far more permissive
// than nextEmailKey(): a lead who replied, booked, or got worked by a human still
// gets the deliverable they asked for. Only a real opt-out or a test row blocks it.
//
// This exists because the old behavior was a permanent lockout: the reply gate wrote
// audit_nurture_status='paused_reply', which is in TERMINAL_NURTURE_STATUSES, which
// makes nextEmailKey() return null on every subsequent run — forever. Any lead who
// replied to the confirmation email (to fix an address, ask a question) could never
// be sent their audit through any automated path, while audit_status read 'delivered'.
export function deliveryIsBlocked(contact) {
  if (contact.audit_test === 'true') return { blocked: true, reason: 'test_contact' }
  const status = contact.audit_nurture_status || ''
  if (DELIVERY_BLOCKING_NURTURE_STATUSES.has(status)) {
    return { blocked: true, reason: `opted_out:${status}` }
  }
  // Checked independently of audit_nurture_status: the two fields are written by
  // different systems and either one saying "stop" is authoritative.
  const leadStatus = contact.hs_lead_status || ''
  if (DELIVERY_BLOCKING_LEAD_STATUSES.has(leadStatus)) {
    return { blocked: true, reason: `opted_out:${leadStatus}` }
  }
  return { blocked: false, reason: null }
}

// Is this send a dated re-engagement release rather than a normal ladder step?
//
// True only when a human parked a soft-paused lead on a date and that date has
// arrived. Deliberately checks contactIsSuppressed()'s HARD half first — audit_test
// and the opt-out statuses — so a date can never resurrect a test row or someone who
// unsubscribed. What it DOES override is the soft pause, which is the entire point:
// paused_booked is terminal to nextEmailKey(), so without this a parked lead could
// never be reached again by any automated path, which is the same permanent-lockout
// bug deliveryIsBlocked() was written to fix for deliveries.
export function isReengageRelease(contact) {
  if (contact.audit_test === 'true') return false
  if (!reengageIsDue(contact)) return false
  // deliveryIsBlocked() covers BOTH hard-opt-out lanes — the nurture statuses
  // (unsubscribed / bounced / complained / unqualified) and the lead statuses
  // (UNQUALIFIED / UNSUBSCRIBED / BOUNCED / SPAM_COMPLAINT). Those are the real
  // opt-outs, and no date set by anyone releases them.
  if (deliveryIsBlocked(contact).blocked) return false
  // TERMINAL_LEAD_STATUSES (CALL_BOOKED / CALL_COMPLETED / OPEN_DEAL) is deliberately
  // NOT checked here. This is a correction to the first cut of this feature.
  //
  // Those statuses stop the ladder because a human is in live conversation with the
  // lead. But you only ever PARK someone you have already talked to — so in practice
  // every parked lead carries one of them, and blocking on them made the release path
  // unreachable for the whole population it was written for. The first real case
  // (Marielis Suarez, parked 2026-08-05) sat on CALL_BOOKED from a strategy call three
  // weeks earlier: the status recorded that a conversation HAD happened, not that one
  // was pending.
  //
  // It is also the same call already made for the deal-stage gate in sendNurtureEmail
  // below. Both fields encode "a human is engaged"; bypassing one and enforcing the
  // other was incoherent. The park is a more recent and more specific instruction from
  // that same human, so it wins over both.
  //
  // Residual risk, accepted knowingly: a lead parked today who books a call next week
  // still gets the check-in on release day. The post-park reply gate catches them if
  // they wrote in, but a silent Calendly booking would not be. Clearing the date
  // cancels the touch, and the rung is one-shot regardless.
  if (!SOFT_PAUSE_NURTURE_STATUSES.has(contact.audit_nurture_status || '')) return false
  // One shot. Once the rung has been sent, the release is spent — otherwise a stale
  // past date would re-fire it on every cron run forever.
  return contact.audit_last_email_key !== EMAIL_KEYS.REENGAGE_1
}

export function nextEmailKey(contact) {
  // A future date parks ANY lead, active or not, ahead of every other rule.
  if (reengageHoldActive(contact)) return null

  // Checked before the suppression gate: a due release is precisely a lead whose
  // soft pause makes contactIsSuppressed() true.
  if (isReengageRelease(contact)) return EMAIL_KEYS.REENGAGE_1

  if (contactIsSuppressed(contact)) return null

  const nurtureStatus = contact.audit_nurture_status || 'not_enrolled'
  if (!ACTIVE_NURTURE_STATUSES.has(nurtureStatus)) return null

  const lastKey = contact.audit_last_email_key || ''
  const since = daysSince(contact.audit_last_email_sent_at)
  const auditDelivered = contact.audit_status === 'delivered' && !!contact.audit_pdf_url

  if (!lastKey) return EMAIL_KEYS.EMAIL_1
  if (lastKey === EMAIL_KEYS.EMAIL_1 && auditDelivered) return EMAIL_KEYS.EMAIL_2
  if (lastKey === EMAIL_KEYS.EMAIL_2 && since >= 1) return EMAIL_KEYS.EMAIL_3 // email_3 +2d→+1d (Abe-ratified 2026-07-19)
  if (lastKey === EMAIL_KEYS.EMAIL_3 && since >= 2) return EMAIL_KEYS.EMAIL_4
  if (lastKey === EMAIL_KEYS.EMAIL_4 && since >= 5) return EMAIL_KEYS.EMAIL_5
  // Drop-off recovery: Email 5 + 14d, then + 16d (= Email 5 + 30d). Suppressed on booking/reply.
  if (lastKey === EMAIL_KEYS.EMAIL_5 && since >= 14) return EMAIL_KEYS.RECOVERY_1
  if (lastKey === EMAIL_KEYS.RECOVERY_1 && since >= 16) return EMAIL_KEYS.RECOVERY_2
  return null
}

// What audit_nurture_status should a successful send leave behind?
//
// The subtle case is delivering to a lead who is already paused (replied, booked, or
// manually held). Delivering the audit must NOT silently re-activate their ladder —
// they replied or booked precisely because a human took over, and re-arming emails
// 3-5 is the Esther collision the reply gate was built to prevent. So: send the
// audit, keep the pause. Abe drives from there.
export function resolveNextNurtureStatus(emailKey, contact, isDelivery = false) {
  if (emailKey === EMAIL_KEYS.RECOVERY_2) return 'completed'
  const current = contact.audit_nurture_status || ''
  // A re-engagement touch keeps the pause it was released from. Same reasoning as
  // the delivery case below: the lead is paused because a human took the wheel, and
  // one dated check-in is not a mandate to re-arm emails 3-5 behind it.
  if (emailKey === EMAIL_KEYS.REENGAGE_1 && TERMINAL_NURTURE_STATUSES.has(current)) return current
  if (isDelivery && TERMINAL_NURTURE_STATUSES.has(current)) return current
  return 'active'
}

// Pure content resolver — the bespoke-override precedence, extracted so it's unit
// testable without the network-bound send path. A plain-text `override`
// { subject, text } from Cody's audit pipeline REPLACES the template, but ONLY
// when BOTH fields are present — a half-filled override falls back to the template
// rather than sending a blank subject/body. Returns { subject, text, source }.
export function resolveEmailContent(emailKey, contact, override) {
  if (override && override.subject && override.text) {
    return { subject: override.subject, text: override.text, source: 'override' }
  }
  const email = buildEmailContent(emailKey, contact)
  return { subject: email.subject, text: htmlToText(email.html), source: 'template' }
}

// `override` (optional) carries bespoke, per-property delivery copy from Cody's
// audit pipeline: { subject, text } plain text. When present it REPLACES the
// buildEmailContent template for THIS send only — every guard (idempotency,
// sequence-state, reply gate, deal gate) and the flag-on-success write-back stay
// identical, so audit_last_email_key still records `emailKey` (email_2_audit_ready)
// and audit_status truthfulness is preserved. This is what folds Cody's formerly
// off-system Brevo delivery back onto the single instrumented Gmail path. Absent
// override → unchanged templated behavior (nurture cron, manual deliver form).
// `opts.pendingProps` — contact properties that this send is ABOUT to make true but
// which must not be written until the send actually succeeds (the delivery flip:
// audit_status='delivered' + audit_pdf_url). They are merged onto the fresh contact
// for gating decisions, and written in the same updateContact as the send flags on
// success. If the send skips or throws, they are never written — so the CRM can no
// longer claim an audit was delivered when nothing left the building.
//
// `opts.isDelivery` — this send IS the audit deliverable (email_2), triggered by a
// human via /api/audit-deliver. Bypasses the sequence, reply, and deal gates, which
// exist to protect the follow-up ladder and have no business withholding a requested
// deliverable. Idempotency and hard opt-outs still apply.
export async function sendNurtureEmail(contact, emailKey, override = null, opts = {}) {
  const { pendingProps = null, isDelivery = false } = opts
  const found = await findContactByEmail(contact.email)
  if (!found?.id) {
    return { ok: false, skipped: true, reason: 'contact_not_found' }
  }
  const freshContact = pendingProps ? { ...found, ...pendingProps } : found

  // Idempotency: don't re-send the same step inside a tight window. Applies to
  // deliveries too — a double-submit of the deliver form must not double-send.
  const duplicateWindowDays = 20 / 1440
  const alreadySentThisStep = freshContact.audit_last_email_key === emailKey && daysSince(freshContact.audit_last_email_sent_at) < duplicateWindowDays
  if (alreadySentThisStep) {
    return { ok: true, skipped: true, reason: 'duplicate_recent_send' }
  }

  // Hard opt-out check — the only suppression a delivery honors.
  if (isDelivery) {
    const { blocked, reason } = deliveryIsBlocked(freshContact)
    if (blocked) return { ok: true, skipped: true, reason }
  }

  // The sequence must still expect exactly this step. A delivery is authoritative
  // (Abe is holding the audit and pressing send), so it does not consult the ladder.
  if (!isDelivery) {
    const expectedNextEmail = nextEmailKey(freshContact)
    if (expectedNextEmail !== emailKey) {
      return { ok: true, skipped: true, reason: 'sequence_state_changed', expectedNextEmail }
    }
  }

  const { subject, text } = resolveEmailContent(emailKey, freshContact, override)

  // DRY_RUN: produce the send-plan and STOP — NO external calls of any kind (no
  // Gmail reply-check, no Brevo upsert, no send). A true side-effect-free plan for
  // Maya to QA per email key before the first live run. The reply-gate below is a
  // live-send safety, applied when a real send actually fires.
  if (isDryRun()) {
    return { ok: true, dryRun: true, emailKey, to: freshContact.email, subject, text }
  }

  // Reply-aware pre-send gate (build-spec §4 / doc 15 §C) — LIVE path only. A
  // manual pause, or ANY inbound reply from the lead, stops the send — this is
  // what makes the Esther collision (goodbye → cold re-pitch) structurally
  // impossible. CALL_BOOKED / terminal states are filtered upstream by nextEmailKey.
  //
  // NOT applied to deliveries: a reply is the strongest possible signal the lead
  // still wants the audit. Withholding it because they engaged inverts the intent,
  // and — because paused_reply is terminal — used to lock them out permanently.
  if (!isDelivery) {
    if (freshContact.audit_nurture_status === 'paused_manual') {
      return { ok: true, skipped: true, reason: 'paused_manual' }
    }
    // Reply lookback. Normally 60 days (gmail.js default). For a dated re-engagement
    // that window is wrong in a way that would make the feature inert: a lead gets
    // parked BECAUSE they wrote in to say "not now", so a 60-day lookback would find
    // that very reply and skip the send every time. The park is the human's ruling on
    // that conversation. So a release only looks back to the release date itself —
    // anything the lead has sent SINCE the date is genuinely new and still stops us.
    const isRelease = isReengageRelease(freshContact)
    const replyLookbackDays = isRelease
      ? Math.max(1, Math.ceil(daysSince(freshContact.audit_reengage_after)))
      : undefined
    try {
      if (await hasRecentInboundFrom(freshContact.email, replyLookbackDays)) {
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
  }

  // Deal-stage gate (Abe's ask 2026-07-17) — LIVE path only. The setter/Abe works
  // leads off the "New Lead" column in the HubSpot Sales Pipeline (schedules a
  // call, marks Not a Fit, etc.). That lives on the DEAL, which the sequencer
  // otherwise never reads. Any associated deal off New Lead = a human engaged =
  // stop. No deal → don't suppress (a fresh lead's "- Audit" deal is created in
  // New Lead at submit; a lead that never got one is unaffected). Fail CLOSED on
  // lookup error, mirroring the reply gate above — a suppression signal we can't
  // read is treated as "might be engaged, don't mail."
  //
  // NOT applied to deliveries: a lead already worked into a later stage is a lead
  // who should certainly receive the audit they asked for.
  //
  // NOT applied to a dated re-engagement release either, and for the same reason the
  // reply window narrows above: parking a lead is itself the act of a human working
  // the deal, and it almost always comes WITH a stage move (Hot List -> Long Term FU
  // is the canonical case). Leaving this gate on would mean every lead parked the
  // normal way trips 'deal_engaged' on release day and the date silently does
  // nothing. The date is the more recent and more specific human instruction, so it
  // wins over the stage. Hard opt-outs and the post-park reply check still apply.
  if (!isDelivery && !isReengageRelease(freshContact)) {
    try {
      const deals = await getAssociatedDealStages(freshContact.id)
      // Any-pipeline check (deliberately not scoped to the default pipeline): a deal
      // in ANY other pipeline — e.g. a future "- Full Service" deal — means the lead
      // has moved past the audit funnel, so stopping audit nurture is the safe
      // direction Maya asked for. New Lead (3427549892) exists only in the default
      // pipeline, so a plain stage-id check already excludes other pipelines' deals.
      const engagedDeal = findEngagedDeal(deals, NON_ENGAGING_DEAL_STAGES)
      if (engagedDeal) {
        return { ok: true, skipped: true, reason: 'deal_engaged', dealstage: engagedDeal.dealstage, pipeline: engagedDeal.pipeline }
      }
    } catch (error) {
      console.error('deal_stage_check_failed_skip', emailKey, String(error))
      return { ok: false, skipped: true, reason: 'deal_check_failed' }
    }
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
      subject,
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
  // reaches here, a non-send can no longer record itself as sent. `pendingProps`
  // (the delivery flip) rides in the SAME write, so audit_status='delivered' is
  // now impossible without a real message id behind it.
  const sentAt = isoNow()
  const props = {
    ...(pendingProps || {}),
    audit_last_email_key: emailKey,
    audit_last_email_sent_at: sentAt,
    audit_nurture_status: resolveNextNurtureStatus(emailKey, freshContact, isDelivery),
    audit_brevo_sync_status: brevoUpsertError ? 'errored' : 'synced',
    audit_brevo_last_sync_at: sentAt,
  }
  if (emailKey === EMAIL_KEYS.EMAIL_5 || emailKey === EMAIL_KEYS.RECOVERY_2) props.hs_lead_status = 'NURTURE_FATIGUED'
  // Spend the date on use. audit_last_email_key already makes the release one-shot,
  // but clearing the field is what keeps the CRM honest: a lead showing a
  // re-engage date is a lead still waiting on one, never one already touched.
  if (emailKey === EMAIL_KEYS.REENGAGE_1) props.audit_reengage_after = ''
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
