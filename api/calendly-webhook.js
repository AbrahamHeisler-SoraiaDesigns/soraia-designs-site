import crypto from 'node:crypto'
import { CALENDLY_WEBHOOK_EVENT_TYPES } from './_lib/audit-config.js'
import { upsertBrevoContact } from './_lib/brevo.js'
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

function shouldResumeAfterCancel(contact, payload) {
  const status = contact?.audit_nurture_status || ''
  const rescheduled = payload?.rescheduled === true
  return status === 'paused_booked' && !rescheduled
}

async function syncBooked(email) {
  const contact = await findContactByEmail(email)
  if (!contact?.id) return { ok: true, skipped: true, reason: 'contact_not_found', email }

  const properties = {
    audit_nurture_status: 'paused_booked',
    hs_lead_status: 'CALL_BOOKED',
    audit_brevo_sync_status: 'synced',
    audit_brevo_last_sync_at: isoNow(),
  }

  await updateContact(contact.id, properties)
  await upsertBrevoContact({ ...contact, ...properties, id: contact.id, email })
  return { ok: true, action: 'booked', email, contactId: contact.id }
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
  const email = extractEmail(payload)
  const eventUri = extractEventUri(payload)
  const eventType = extractEventTypeLabel(payload)

  if (!email) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'missing_email', event: eventName, eventUri, eventType })
  }

  const result = eventName === 'invitee.created'
    ? await syncBooked(email)
    : await syncCanceled(email, payload)

  return res.status(200).json({ ok: true, event: eventName, email, eventUri, eventType, result })
}
