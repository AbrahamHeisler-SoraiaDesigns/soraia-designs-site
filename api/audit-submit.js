import { auditFormSchema } from '../src/lib/audit-schema.js'
import crypto from 'node:crypto'

const HUBSPOT_PORTAL_ID = '245704749'

function getMissingCriticalEnv() {
  const required = ['HUBSPOT_AUDIT_FORM_GUID']
  return required.filter((key) => !process.env[key])
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(s.trim().toLowerCase()).digest('hex')
}

function makeEventId(email, address) {
  const minute = Math.floor(Date.now() / 60_000)
  return crypto
    .createHash('sha256')
    .update(`${email}|${address}|${minute}`)
    .digest('hex')
}

function splitName(full) {
  const trimmed = (full || '').trim()
  const i = trimmed.indexOf(' ')
  if (i < 0) return { firstname: trimmed, lastname: '' }
  return { firstname: trimmed.slice(0, i), lastname: trimmed.slice(i + 1).trim() }
}

async function postToHubspotForm(payload, eventId) {
  const formGuid = process.env.HUBSPOT_AUDIT_FORM_GUID
  if (!formGuid) {
    console.warn('[audit-submit] HUBSPOT_AUDIT_FORM_GUID not set — skipping HubSpot post')
    return { skipped: true, reason: 'missing_form_guid' }
  }

  const { firstname, lastname } = splitName(payload.full_name)
  const fields = [
    { name: 'firstname', value: firstname },
    { name: 'lastname', value: lastname },
    { name: 'email', value: payload.email },
    { name: 'phone', value: payload.phone },
    { name: 'audit_property_street', value: payload.property_street },
    { name: 'audit_property_city', value: payload.property_city },
    { name: 'audit_property_state', value: payload.property_state },
    { name: 'audit_property_zip', value: payload.property_zip },
    { name: 'audit_property_bedrooms', value: String(payload.property_bedrooms) },
    { name: 'audit_property_bathrooms', value: String(payload.property_bathrooms) },
    { name: 'audit_is_listed', value: payload.is_listed },
    { name: 'audit_listing_url', value: payload.listing_url || '' },
    { name: 'audit_primary_goal', value: payload.primary_goal },
    { name: 'audit_target_adr', value: payload.target_adr ? String(payload.target_adr) : '' },
    { name: 'audit_current_performance', value: payload.current_performance || '' },
    { name: 'audit_budget_tier', value: payload.budget_tier },
    { name: 'audit_timeline', value: payload.timeline },
    { name: 'audit_notes', value: payload.notes || '' },
    { name: 'audit_referrer', value: payload.referrer || '' },
    { name: 'audit_landing_page', value: payload.landing_page || '' },
    { name: 'audit_submit_timestamp', value: new Date().toISOString() },
    { name: 'audit_status', value: 'requested' },
  ].filter((f) => f.value !== '' && f.value != null)

  const url = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${formGuid}`
  const body = {
    fields,
    context: {
      pageUri: payload.landing_page || '',
      pageName: 'Audit Request — Soraia Designs',
      hutk: payload.hubspotutk || undefined,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HubSpot Forms API ${res.status}: ${text}`)
  }
  return { ok: true, eventId }
}

async function fireMetaCAPI(payload, eventId, clientIp, userAgent) {
  const pixelId = process.env.META_PIXEL_ID || '533276610461087'
  const token = process.env.META_CAPI_ACCESS_TOKEN
  if (!token) {
    console.warn('[audit-submit] META_CAPI_ACCESS_TOKEN not set — skipping CAPI')
    return { skipped: true, reason: 'missing_token' }
  }
  const userData = {
    em: [sha256Hex(payload.email)],
    ph: [sha256Hex(payload.phone.replace(/\D/g, ''))],
    client_ip_address: clientIp,
    client_user_agent: userAgent,
  }
  if (payload.fbp) userData.fbp = payload.fbp
  if (payload.fbc) userData.fbc = payload.fbc

  const body = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: payload.landing_page || 'https://www.soraiadesigns.com/audit/get-started',
      user_data: userData,
    }],
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('[audit-submit] CAPI failed (non-blocking):', res.status, text)
    return { ok: false, status: res.status }
  }
  return { ok: true }
}

async function notifyInternal(payload, eventId, contactInfo) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.INTERNAL_NOTIFY_EMAIL || 'abe@soraiadesigns.com'
  if (!apiKey) {
    console.warn('[audit-submit] RESEND_API_KEY not set — skipping internal notify')
    return { skipped: true, reason: 'missing_resend_key' }
  }
  const lines = Object.entries(payload)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => `<p><strong>${k}:</strong> ${String(v ?? '')}</p>`)
    .join('')
  const html = `
    <h2>New audit request — ${payload.full_name}</h2>
    <p>Property: ${payload.property_street}, ${payload.property_city}, ${payload.property_state} ${payload.property_zip}</p>
    <p>Event ID: ${eventId}</p>
    ${contactInfo ? `<p>HubSpot contact: ${contactInfo}</p>` : ''}
    <hr>
    ${lines}
  `
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'Soraia Designs <audit@soraiadesigns.com>',
      to: [to],
      subject: `New audit request — ${payload.full_name} (${payload.property_city}, ${payload.property_state})`,
      html,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('[audit-submit] Resend notify failed:', res.status, text)
    return { ok: false }
  }
  return { ok: true }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  let raw
  try {
    raw = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ message: 'Invalid JSON body' })
  }

  // Honeypot
  if (raw && raw._company_legal_name) {
    return res.status(200).json({ ok: true, event_id: null, honeypot: true })
  }

  const parsed = auditFormSchema.safeParse(raw)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten?.() ?? parsed.error,
    })
  }

  const data = parsed.data
  const missingCriticalEnv = getMissingCriticalEnv()
  if (missingCriticalEnv.length > 0) {
    console.error('[audit-submit] Missing critical env:', missingCriticalEnv.join(', '))
    return res.status(503).json({
      ok: false,
      message: 'Audit request form is temporarily unavailable. Please email abe@soraiadesigns.com directly.',
      code: 'FORM_MISCONFIGURED',
    })
  }

  const eventId = makeEventId(data.email, `${data.property_street} ${data.property_zip}`)
  const clientIp =
    (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket?.remoteAddress || '').trim()
  const userAgent = req.headers['user-agent'] || ''

  const tasks = await Promise.allSettled([
    postToHubspotForm({ ...data, ...raw }, eventId),
    fireMetaCAPI({ ...data, ...raw }, eventId, clientIp, userAgent),
    notifyInternal({ ...data, ...raw }, eventId, null),
  ])

  const [hubspot, capi, notify] = tasks
  const hubspotOk = hubspot.status === 'fulfilled'

  if (!hubspotOk) {
    console.error('[audit-submit] HubSpot post failed:', hubspot.reason)
  }

  return res.status(hubspotOk ? 200 : 502).json({
    ok: hubspotOk,
    event_id: eventId,
    hubspot: hubspot.status === 'fulfilled' ? hubspot.value : { error: String(hubspot.reason) },
    capi: capi.status === 'fulfilled' ? capi.value : { error: String(capi.reason) },
    notify: notify.status === 'fulfilled' ? notify.value : { error: String(notify.reason) },
  })
}
