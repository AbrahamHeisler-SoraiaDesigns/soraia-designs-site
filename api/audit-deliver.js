// audit-deliver — the one-click "audit delivered" flip that fixes the June stall.
//
// June failure mode: audits were hand-delivered (here.now / Gmail), so
// `audit_status` never flipped to `delivered` and `audit_pdf_url` stayed empty.
// nextEmailKey() gates email 2 on exactly those two fields, so nurture 2–5 never
// fired and every lead stranded at email_1_confirmation. This endpoint gives Abe
// a one-field surface: paste the published audit URL for a contact, and it
//   1. sets audit_status='delivered' + audit_pdf_url on the HubSpot contact, and
//   2. immediately releases the next nurture email (normally email 2 "audit
//      ready"); emails 3–5 then flow on the existing daily cron cadence.
//
// Auth: AUDIT_DELIVER_SECRET (falls back to CRON_SECRET). If neither is set the
// endpoint is disabled (503) — it never runs open. GET renders a tiny form when
// the key is supplied in the query; POST performs the flip.
//
// Suppression is honored automatically: sendNurtureEmail() re-derives the next
// step via nextEmailKey(), which returns null for any terminal/unsubscribed/
// bounced/booked contact — so a suppressed lead gets the status flip (for
// reporting) but no email is sent.

import { nextEmailKey, sendNurtureEmail } from './_lib/nurture.js'
import { findContactByEmail, updateContact, buildContactUrl } from './_lib/hubspot.js'
import { isoNow } from './_lib/audit-utils.js'

function deliverSecret() {
  return process.env.AUDIT_DELIVER_SECRET || process.env.CRON_SECRET || ''
}

function authorized(req, bodyKey) {
  const secret = deliverSecret()
  if (!secret) return false
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const queryKey = req.query?.key
  return bearer === secret || queryKey === secret || bodyKey === secret
}

const isHttpUrl = (v) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(String(v || '').trim())

// Escape every user-controlled value before it lands in an HTML response.
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

function jsonBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') return JSON.parse(req.body)
  return req.body
}

function page(title, body) {
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Arial,sans-serif;padding:40px;color:#2c2a27;background:#f7f5f0;}
  .card{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e1d8;border-radius:12px;padding:28px;}
  h1{font-size:22px;margin:0 0 6px;} p{color:#555;line-height:1.5;}
  label{display:block;font-weight:600;margin:18px 0 6px;font-size:14px;}
  input{width:100%;padding:11px 12px;border:1px solid #cfc9bd;border-radius:6px;font-size:15px;box-sizing:border-box;}
  button{margin-top:22px;background:#2c2a27;color:#fff;border:0;padding:12px 22px;border-radius:6px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;}
  .ok{color:#2f7a45;} .err{color:#b3261e;} a{color:#8a6d3b;} code{background:#f0ece3;padding:2px 5px;border-radius:4px;}
</style></head><body><div class="card">${body}</div></body></html>`
}

function formBody(key, prefill = {}) {
  const email = esc(prefill.email || '')
  return `
    <h1>Deliver audit &rarr; release nurture</h1>
    <p>Paste the contact's email and the published audit URL (here.now link). This flips
       <code>audit_status</code> to <code>delivered</code> and releases the next nurture email.</p>
    <form method="POST" action="/api/audit-deliver">
      <input type="hidden" name="key" value="${esc(key)}"/>
      <label>Contact email</label>
      <input type="email" name="email" required value="${email}" placeholder="owner@example.com"/>
      <label>Published audit URL</label>
      <input type="url" name="audit_pdf_url" required placeholder="https://something.here.now"/>
      <button type="submit">Deliver &amp; release</button>
    </form>`
}

export default async function handler(req, res) {
  if (!deliverSecret()) {
    return res.status(503).json({ ok: false, message: 'audit-deliver is disabled (no AUDIT_DELIVER_SECRET / CRON_SECRET set)' })
  }

  if (req.method === 'GET') {
    if (!authorized(req)) {
      return res.status(401).send(page('Unauthorized', '<h1>Unauthorized</h1><p>Append <code>?key=YOUR_SECRET</code> to load the delivery form.</p>'))
    }
    return res.status(200).send(page('Deliver audit', formBody(req.query.key)))
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  let body
  try {
    body = jsonBody(req)
  } catch (error) {
    return res.status(400).json({ ok: false, message: `Invalid JSON: ${String(error)}` })
  }

  const wantsHtml = String(req.headers['content-type'] || '').includes('form-urlencoded') ||
    String(req.headers.accept || '').includes('text/html')

  if (!authorized(req, body.key)) {
    const msg = 'Unauthorized'
    return wantsHtml
      ? res.status(401).send(page(msg, `<h1 class="err">${msg}</h1><p>Bad or missing key.</p>`))
      : res.status(401).json({ ok: false, message: msg })
  }

  const email = String(body.email || '').trim().toLowerCase()
  const auditPdfUrl = String(body.audit_pdf_url || '').trim()

  if (!email || !isHttpUrl(auditPdfUrl)) {
    const msg = 'A valid contact email and http(s) audit URL are both required.'
    return wantsHtml
      ? res.status(400).send(page('Missing input', `<h1 class="err">Missing input</h1><p>${msg}</p>${formBody(body.key, { email })}`))
      : res.status(400).json({ ok: false, message: msg })
  }

  let contact
  try {
    contact = await findContactByEmail(email)
  } catch (error) {
    const msg = `HubSpot lookup failed: ${String(error)}`
    return wantsHtml
      ? res.status(502).send(page('Lookup failed', `<h1 class="err">Lookup failed</h1><p>${esc(msg)}</p>${formBody(body.key, { email })}`))
      : res.status(502).json({ ok: false, message: msg })
  }
  if (!contact?.id) {
    const msg = `No HubSpot contact found for ${email}.`
    return wantsHtml
      ? res.status(404).send(page('Not found', `<h1 class="err">Not found</h1><p>No HubSpot contact found for <strong>${esc(email)}</strong>.</p>${formBody(body.key)}`))
      : res.status(404).json({ ok: false, message: msg })
  }

  // 1) Flip delivery state — the two fields nextEmailKey() gates email 2 on.
  // 2) Release the next nurture email. Re-derive from the (now-delivered) state
  //    rather than hardcoding email 2, so an unconfirmed or suppressed contact is
  //    handled correctly. sendNurtureEmail re-fetches fresh + self-guards.
  const merged = { ...contact, audit_status: 'delivered', audit_pdf_url: auditPdfUrl }
  const emailKey = nextEmailKey(merged)
  let released = null
  try {
    await updateContact(contact.id, {
      audit_status: 'delivered',
      audit_pdf_url: auditPdfUrl,
    })
    if (emailKey) released = await sendNurtureEmail(merged, emailKey)
  } catch (error) {
    const msg = `Delivery flip failed after contact lookup: ${String(error)}`
    return wantsHtml
      ? res.status(502).send(page('Flip failed', `<h1 class="err">Flip failed</h1><p>${esc(msg)}</p>`))
      : res.status(502).json({ ok: false, message: msg, contactId: contact.id })
  }

  const contactUrl = buildContactUrl(contact.id)
  const result = {
    ok: true,
    email,
    contactId: contact.id,
    contactUrl,
    audit_status: 'delivered',
    audit_pdf_url: auditPdfUrl,
    releasedEmailKey: emailKey || null,
    released,
    at: isoNow(),
  }

  if (wantsHtml) {
    const sent = emailKey && released?.ok && !released?.skipped
    const note = sent
      ? `Released <code>${emailKey}</code>.`
      : emailKey
        ? `Next email <code>${esc(emailKey)}</code> was not sent (${esc(released?.reason || released?.error || 'suppressed/guarded')}). Status still flipped; the daily cron will pick it up when eligible.`
        : 'Contact is suppressed or terminal, so no email was released. Status flipped for reporting.'
    return res.status(200).send(page('Delivered', `
      <h1 class="ok">Audit marked delivered</h1>
      <p><strong>${esc(email)}</strong> &rarr; <code>audit_status=delivered</code>. ${note}</p>
      <p><a href="${contactUrl}" target="_blank" rel="noopener">Open the HubSpot contact &rarr;</a></p>
      <p><a href="/api/audit-deliver?key=${encodeURIComponent(body.key)}">Deliver another &rarr;</a></p>`))
  }

  return res.status(200).json(result)
}
