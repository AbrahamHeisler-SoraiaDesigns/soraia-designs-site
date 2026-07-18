import { setBrevoContactEmailBlacklisted } from './_lib/brevo.js'
import { findContactByEmail, updateContact } from './_lib/hubspot.js'
import { isoNow, unsubscribeSignature } from './_lib/audit-utils.js'

function jsonBody(req) {
  if (!req.body) return null
  if (typeof req.body === 'string') return JSON.parse(req.body)
  return req.body
}

function normalizeEventName(raw) {
  return String(raw || '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

function webhookAuthorized(req) {
  const secret = process.env.BREVO_WEBHOOK_SECRET
  if (!secret) return true
  const querySecret = req.query?.secret
  const headerSecret = req.headers['x-brevo-secret'] || req.headers['x-webhook-secret']
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  return querySecret === secret || headerSecret === secret || bearer === secret
}

function unsubscribeAuthorized(email, sig) {
  return !!email && !!sig && unsubscribeSignature(email) === sig
}

function updateForEvent(name) {
  switch (name) {
    case 'reply':
    case 'inbound_email_processed':
      return {
        properties: {
          audit_nurture_status: 'paused_reply',
          hs_lead_status: 'REPLIED',
          audit_brevo_sync_status: 'synced',
          audit_brevo_last_sync_at: isoNow(),
        },
        blacklist: false,
      }
    case 'unsubscribed':
      return {
        properties: {
          audit_nurture_status: 'unsubscribed',
          hs_lead_status: 'UNSUBSCRIBED',
          audit_brevo_sync_status: 'synced',
          audit_brevo_last_sync_at: isoNow(),
        },
        blacklist: true,
      }
    case 'hard_bounce':
    case 'soft_bounce':
    case 'blocked':
    case 'invalid':
      return {
        properties: {
          audit_nurture_status: 'bounced',
          hs_lead_status: 'BOUNCED',
          audit_brevo_sync_status: 'synced',
          audit_brevo_last_sync_at: isoNow(),
        },
        blacklist: true,
      }
    case 'spam':
      return {
        properties: {
          audit_nurture_status: 'complained',
          hs_lead_status: 'SPAM_COMPLAINT',
          audit_brevo_sync_status: 'synced',
          audit_brevo_last_sync_at: isoNow(),
        },
        blacklist: true,
      }
    default:
      return null
  }
}

// Properties that actually gate re-mailing. If the enum options are missing and
// updateContact's non-atomic fallback salvages the harmless props but DROPS one of
// these, the contact isn't really suppressed — so we must NOT report success. This
// keeps the failure LOUD (the handler 500s) regardless of deploy order, instead of
// the defensive salvage quietly turning a 500 into a false "you're unsubscribed"
// 200 while the sequence keeps mailing. (audit_nurture_status is the one the
// sequencer + Brevo suppression both read; hs_lead_status kept critical for parity.)
const SUPPRESSION_CRITICAL_PROPS = ['audit_nurture_status', 'hs_lead_status']

async function suppressByEmail(email, properties, blacklist = true) {
  const contact = await findContactByEmail(email)
  if (!contact?.id) return { ok: false, email, reason: 'contact_not_found' }
  const update = await updateContact(contact.id, properties)
  // Detect a partial write that dropped a suppression-critical property.
  if (update?._partial) {
    const droppedCritical = (update.dropped || [])
      .map((d) => d.property)
      .filter((p) => SUPPRESSION_CRITICAL_PROPS.includes(p) && p in properties)
    if (droppedCritical.length > 0) {
      return { ok: false, email, reason: `suppression_prop_dropped:${droppedCritical.join(',')}` }
    }
  }
  if (blacklist) {
    try {
      await setBrevoContactEmailBlacklisted(email, true)
    } catch (error) {
      return { ok: false, email, reason: `hubspot_updated_brevo_blacklist_failed:${String(error)}` }
    }
  }
  return { ok: true, email }
}

function extractEmail(event) {
  return String(event.email || event.sender?.email || event.from || '').trim().toLowerCase()
}

function isAuditNurtureEvent(event) {
  const tags = Array.isArray(event.tags) ? event.tags : event.tag ? [event.tag] : []
  return tags.length === 0 || tags.includes('audit-nurture')
}

function htmlResponse(title, body) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; }
        .card { max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
        h1 { margin-top: 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>${title}</h1>
        ${body}
      </div>
    </body>
  </html>`
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const email = String(req.query?.email || '').trim().toLowerCase()
    const sig = String(req.query?.sig || '')
    if (!unsubscribeAuthorized(email, sig)) {
      return res.status(401).send(htmlResponse('Link expired', '<p>This unsubscribe link is invalid or expired.</p>'))
    }

    const result = await suppressByEmail(email, {
      audit_nurture_status: 'unsubscribed',
      hs_lead_status: 'UNSUBSCRIBED',
      audit_brevo_sync_status: 'synced',
      audit_brevo_last_sync_at: isoNow(),
    })

    if (!result.ok && result.reason !== 'contact_not_found') {
      return res.status(500).send(htmlResponse('Something went wrong', '<p>We could not complete the unsubscribe request right now.</p>'))
    }

    return res.status(200).send(htmlResponse('You are unsubscribed', '<p>You will not receive additional audit follow-up emails from this sequence.</p>'))
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  if (!webhookAuthorized(req)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' })
  }

  let payload
  try {
    payload = jsonBody(req)
  } catch (error) {
    return res.status(400).json({ ok: false, message: `Invalid JSON: ${String(error)}` })
  }

  const events = Array.isArray(payload) ? payload : [payload]
  const results = []

  for (const event of events) {
    if (!isAuditNurtureEvent(event)) {
      results.push({ ok: true, skipped: true, reason: 'non_audit_tag' })
      continue
    }

    const name = normalizeEventName(event.event || event.type || event.message_type || event.msg_status)
    const update = updateForEvent(name)
    const email = extractEmail(event)

    if (!update || !email) {
      results.push({ ok: true, skipped: true, reason: 'ignored_event', event: name || null, email: email || null })
      continue
    }

    results.push(await suppressByEmail(email, update.properties, update.blacklist))
  }

  return res.status(200).json({ ok: true, processed: results.length, results })
}
