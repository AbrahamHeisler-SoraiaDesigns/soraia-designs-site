import crypto from 'node:crypto'
import { CALENDLY_WEBHOOK_EVENT_TYPES } from './_lib/audit-config.js'
import { sendResendEmail, upsertBrevoContact } from './_lib/brevo.js'
import { findContactByEmail, updateContact } from './_lib/hubspot.js'
import { isoNow } from './_lib/audit-utils.js'

function rawBody(req) {
  if (!req.body) return ''
  return typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
}

function jsonBody(req) {
  if (!req.body) return null
  if (typeof req.body === 'string') return JSON.parse(req.body)
  return req.body
}

function verifySignature(req, raw) {
  const key = process.env.CALENDLY_WEBHOOK_SIGNING_KEY
  if (!key) return true

  const header = req.headers['calendly-webhook-signature'] || req.headers['Calendly-Webhook-Signature']
  if (!header) return false

  const parts = Object.fromEntries(
    String(header)
      .split(',')
      .map((part) => part.trim().split('='))
      .filter(([k, v]) => k && v)
  )

  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) return false

  const signed = `${timestamp}.${raw}`
  const digest = crypto.createHmac('sha256', key).update(signed).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
  } catch {
    return false
  }
}

function normalizeEventName(payload) {
  return String(payload?.event || payload?.type || '').trim().toLowerCase()
}

function extractPayload(body) {
  return body?.payload || body || null
}

function extractEmail(payload) {
  return String(
    payload?.email ||
      payload?.invitee?.email ||
      payload?.tracking?.invitee_email ||
      ''
  )
    .trim()
    .toLowerCase()
}

function extractEventUri(payload) {
  return payload?.event || payload?.scheduled_event?.uri || payload?.payload?.event || null
}

function extractEventTypeLabel(payload) {
  return (
    payload?.event_type?.name ||
    payload?.event_type ||
    payload?.scheduled_event?.name ||
    payload?.name ||
    ''
  )
}

function answers(payload) {
  return Array.isArray(payload?.questions_and_answers) ? payload.questions_and_answers : []
}

function answerForQuestion(payload, matcher) {
  const row = answers(payload).find((item) => matcher(String(item?.question || '').trim().toLowerCase()))
  return String(row?.answer || '').trim()
}

function isAuditReviewEvent(eventType) {
  return /audit review|next steps/i.test(String(eventType || ''))
}

function completedAuditAnswer(payload) {
  return answerForQuestion(payload, (q) => q.includes('completed a soraia') || q.includes('completed the audit'))
}

function completedAuditIsNo(payload) {
  return /^no\b/i.test(completedAuditAnswer(payload))
}

function auditEmailAnswer(payload) {
  return answerForQuestion(payload, (q) => q.includes('what email address did you use') || q.includes('used when requesting your audit'))
    .toLowerCase()
}

async function sendAuditFormFollowup(inviteeEmail) {
  const siteBase = (process.env.SITE_BASE_URL || 'https://www.soraiadesigns.com').replace(/\/$/, '')
  const auditUrl = `${siteBase}/audit`
  const html = `
    <p>Thanks for booking.</p>
    <p>To help us prepare for your call, please complete the audit request form here before we meet:</p>
    <p><a href="${auditUrl}"><strong>${auditUrl}</strong></a></p>
    <p>Once that is in, we will have the right context going into the conversation.</p>
    <p>Abe<br/>Soraia Designs</p>
  `
  return sendResendEmail({
    toEmail: inviteeEmail,
    subject: 'Quick step before your call',
    html,
  })
}

function shouldResumeAfterCancel(contact, payload) {
  const status = contact?.audit_nurture_status || ''
  const rescheduled = payload?.rescheduled === true
  return status === 'paused_booked' && !rescheduled
}

async function syncBooked(lookupEmail, inviteeEmail, eventType, payload) {
  const isAuditReview = isAuditReviewEvent(eventType)
  const answeredNo = isAuditReview && completedAuditIsNo(payload)
  let followupSent = false
  let followupError = null

  if (answeredNo) {
    try {
      await sendAuditFormFollowup(inviteeEmail)
      followupSent = true
    } catch (error) {
      followupError = String(error)
    }
  }

  const contact = await findContactByEmail(lookupEmail)
  if (!contact?.id) {
    return {
      ok: true,
      skipped: true,
      reason: 'contact_not_found',
      email: lookupEmail,
      inviteeEmail,
      followupSent,
      followupError,
      auditReviewAnsweredNo: answeredNo,
    }
  }

  const properties = {
    audit_nurture_status: 'paused_booked',
    hs_lead_status: 'CALL_BOOKED',
    audit_brevo_sync_status: 'synced',
    audit_brevo_last_sync_at: isoNow(),
  }

  await updateContact(contact.id, properties)
  await upsertBrevoContact({ ...contact, ...properties, id: contact.id, email: lookupEmail })
  return {
    ok: true,
    action: 'booked',
    email: lookupEmail,
    inviteeEmail,
    contactId: contact.id,
    followupSent,
    followupError,
    auditReviewAnsweredNo: answeredNo,
  }
}

async function syncCanceled(email, payload) {
  const contact = await findContactByEmail(email)
  if (!contact?.id) return { ok: true, skipped: true, reason: 'contact_not_found', email }
  if (!shouldResumeAfterCancel(contact, payload)) {
    return { ok: true, skipped: true, reason: 'no_resume_needed', email, contactId: contact.id }
  }

  const properties = {
    audit_nurture_status: 'active',
    audit_brevo_sync_status: 'synced',
    audit_brevo_last_sync_at: isoNow(),
  }

  await updateContact(contact.id, properties)
  await upsertBrevoContact({ ...contact, ...properties, id: contact.id, email })
  return { ok: true, action: 'canceled_resumed', email, contactId: contact.id }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  const raw = rawBody(req)
  if (!verifySignature(req, raw)) {
    return res.status(401).json({ ok: false, message: 'Invalid signature' })
  }

  let body
  try {
    body = jsonBody(req)
  } catch (error) {
    return res.status(400).json({ ok: false, message: `Invalid JSON: ${String(error)}` })
  }

  const eventName = normalizeEventName(body)
  if (!CALENDLY_WEBHOOK_EVENT_TYPES.has(eventName)) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'ignored_event', event: eventName || null })
  }

  const payload = extractPayload(body)
  const inviteeEmail = extractEmail(payload)
  const eventUri = extractEventUri(payload)
  const eventType = extractEventTypeLabel(payload)
  const auditEmail = auditEmailAnswer(payload)
  const lookupEmail = isAuditReviewEvent(eventType) && auditEmail ? auditEmail : inviteeEmail

  if (!inviteeEmail) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'missing_email', event: eventName, eventUri, eventType })
  }

  const result = eventName === 'invitee.created'
    ? await syncBooked(lookupEmail, inviteeEmail, eventType, payload)
    : await syncCanceled(lookupEmail, payload)

  return res.status(200).json({ ok: true, event: eventName, email: inviteeEmail, lookupEmail, eventUri, eventType, result })
}
