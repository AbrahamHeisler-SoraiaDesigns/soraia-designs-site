import crypto from 'node:crypto'

// Quo (formerly OpenPhone) inbound-message webhook → #procurement Slack relay.
// Registered against the Operations line (+1 754 254 6515); humans work the Quo
// app, this relay is how Claudia/Hermes see vendor and delivery replies.

export const config = { api: { bodyParser: false } }

const SLACK_CHANNEL_FALLBACK = 'C0BN6HACH3P' // #procurement

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

// Quo signs webhooks with `openphone-signature: hmac;1;<timestamp>;<base64 digest>`
// where digest = HMAC-SHA256(base64decode(secret), `${timestamp}.${rawBody}`).
// Some keys are issued raw rather than base64 — accept either derivation.
function verifySignature(req, raw) {
  const secret = process.env.QUO_WEBHOOK_SECRET
  if (!secret) return true // staging mode: registration writes the secret later

  const header = req.headers['openphone-signature'] || req.headers['quo-signature']
  if (!header) return false

  const fields = String(header).split(';')
  if (fields.length < 4) return false
  const [, , timestamp, provided] = fields
  const signed = `${timestamp}.${raw}`

  const candidates = []
  try {
    candidates.push(crypto.createHmac('sha256', Buffer.from(secret, 'base64')).update(signed).digest('base64'))
  } catch {
    /* not base64 — raw fallback below still runs */
  }
  candidates.push(crypto.createHmac('sha256', secret).update(signed).digest('base64'))

  return candidates.some((digest) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(provided))
    } catch {
      return false
    }
  })
}

function extractMessage(body) {
  const msg = body?.data?.object || body?.data || {}
  return {
    from: msg.from || '',
    to: Array.isArray(msg.to) ? msg.to.join(', ') : msg.to || '',
    text: msg.body || msg.text || '',
    media: Array.isArray(msg.media) ? msg.media : [],
    phoneNumberId: msg.phoneNumberId || '',
  }
}

async function postToSlack(message) {
  const token = process.env.QUO_SLACK_BOT_TOKEN
  const channel = process.env.QUO_SLACK_CHANNEL || SLACK_CHANNEL_FALLBACK
  if (!token) return { ok: false, error: 'missing_slack_token' }

  const mediaNote = message.media.length
    ? `\n:paperclip: ${message.media.length} attachment(s): ${message.media.map((m) => m.url || m).join(' ')}`
    : ''
  const text = `:package: *Inbound text* on the Operations line\nFrom: ${message.from}\n> ${message.text || '(no text)'}${mediaNote}\n_Reply from the Quo app — this is a read-only relay._`

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ channel, text, unfurl_links: false }),
  })
  return res.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  const raw = await readRawBody(req)
  if (!verifySignature(req, raw)) {
    return res.status(401).json({ ok: false, message: 'Invalid signature' })
  }

  let body
  try {
    body = JSON.parse(raw || '{}')
  } catch (error) {
    return res.status(400).json({ ok: false, message: `Invalid JSON: ${String(error)}` })
  }

  const eventType = String(body?.type || '').toLowerCase()
  if (eventType !== 'message.received') {
    return res.status(200).json({ ok: true, skipped: true, reason: 'ignored_event', event: eventType || null })
  }

  const message = extractMessage(body)

  // If a phone-number filter is configured, drop traffic from any other line.
  const wantedLine = process.env.QUO_PHONE_NUMBER_ID
  if (wantedLine && message.phoneNumberId && message.phoneNumberId !== wantedLine) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'other_line' })
  }

  const slack = await postToSlack(message)
  return res.status(200).json({ ok: true, event: eventType, relayed: Boolean(slack.ok), slackError: slack.ok ? null : slack.error || null })
}
