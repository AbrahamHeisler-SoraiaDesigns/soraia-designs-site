// ops-notify — internal ops email to abe@, via the same sendGmailAs plumbing the
// audit sequencer uses. This is NOT a lead-facing send and NEVER touches HubSpot
// delivery state — it exists so the headless audit worker (soraia_audit_hubspot_
// poller.py) can reach Abe's inbox for the two things the v3 auto-send spec routes
// to email instead of Telegram (Abe isn't connected to the Telegram setup):
//   1. [HOLD] alerts — an N-check / validity-gate / publish / delivery failure that
//      stops an auto-send, sent immediately so Abe can eyeball it same-day.
//   2. The EOD digest — one summary of what shipped and what held that day.
//
// abe@ -> abe@ self-send is intentional (shows as "me" in his inbox). Recipient is
// fixed server-side (OPS_EMAIL, default abe@) — the caller supplies only subject +
// text, so this endpoint can never be pointed at an arbitrary address.
//
// Auth: OPS_NOTIFY_SECRET (falls back to CRON_SECRET). No secret set -> 503, never
// runs open. POST { subject, text, key? }.

import { sendGmailAs } from './_lib/gmail.js'

const OPS_EMAIL = process.env.OPS_EMAIL || 'abe@soraiadesigns.com'

function opsSecret() {
  return process.env.OPS_NOTIFY_SECRET || process.env.CRON_SECRET || ''
}

function authorized(req, bodyKey) {
  const secret = opsSecret()
  if (!secret) return false
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const queryKey = req.query?.key
  return bearer === secret || queryKey === secret || bodyKey === secret
}

function jsonBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') return JSON.parse(req.body)
  return req.body
}

export default async function handler(req, res) {
  if (!opsSecret()) {
    return res.status(503).json({ ok: false, message: 'ops-notify disabled (no OPS_NOTIFY_SECRET / CRON_SECRET set)' })
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  let body
  try {
    body = jsonBody(req)
  } catch (error) {
    return res.status(400).json({ ok: false, message: `Invalid JSON: ${String(error)}` })
  }

  if (!authorized(req, body.key)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' })
  }

  const subject = String(body.subject || '').trim()
  const text = String(body.text || '').trim()
  if (!subject || !text) {
    return res.status(400).json({ ok: false, message: 'subject and text are both required' })
  }

  try {
    // Recipient is server-fixed to OPS_EMAIL — body cannot redirect it.
    const result = await sendGmailAs({ to: OPS_EMAIL, subject, text })
    return res.status(200).json({ ok: true, to: OPS_EMAIL, status: result.status, messageId: result.messageId || null })
  } catch (error) {
    return res.status(502).json({ ok: false, message: `ops-notify send failed: ${String(error)}` })
  }
}
