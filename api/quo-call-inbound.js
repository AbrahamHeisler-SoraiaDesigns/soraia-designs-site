import crypto from 'node:crypto'

// Quo (formerly OpenPhone) call-activity webhook → #procurement-phone Slack relay.
// Registered against the Operations line (+1 754 254 6515) for call.completed,
// call.summary.completed, and call.transcript.completed. Kept separate from
// quo-inbound.js (texts → #procurement) so the text channel doesn't get clogged
// with call summaries/transcripts.

export const config = { api: { bodyParser: false } }

const SLACK_CHANNEL_FALLBACK = 'C0BPYPC8WPQ' // #procurement-phone

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

// calls / call-summaries / call-transcripts are three separately-registered webhook
// objects even though they share this endpoint URL, and Quo issues each its own
// signing key — try every configured secret and accept on first match.
function verifySignature(req, raw) {
  const secrets = [
    process.env.QUO_WEBHOOK_SECRET_CALLS,
    process.env.QUO_WEBHOOK_SECRET_CALL_SUMMARY,
    process.env.QUO_WEBHOOK_SECRET_CALL_TRANSCRIPT,
  ].filter(Boolean)
  if (!secrets.length) return true // staging mode: registration writes secrets later

  const header = req.headers['openphone-signature'] || req.headers['quo-signature']
  if (!header) return false

  const fields = String(header).split(';')
  if (fields.length < 4) return false
  const [, , timestamp, provided] = fields
  const signed = `${timestamp}.${raw}`

  return secrets.some((secret) => {
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
  })
}

function fmtDuration(seconds) {
  if (seconds === null || seconds === undefined) return 'unknown'
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function shortId(id) {
  return id ? String(id).slice(-6) : '??????'
}

function fmtCall(obj) {
  const direction = obj.direction === 'outgoing' ? ':arrow_upper_right: Outgoing' : ':arrow_lower_left: Incoming'
  const participants = Array.isArray(obj.participants) ? obj.participants.join(', ') : obj.participants || 'unknown'
  return (
    `:telephone_receiver: *${direction} call* — \`${shortId(obj.id)}\`\n` +
    `Participant(s): ${participants}\n` +
    `Status: ${obj.status || 'unknown'} · Duration: ${fmtDuration(obj.duration)}`
  )
}

function fmtSummary(obj) {
  const bullets = Array.isArray(obj.summary) ? obj.summary : []
  const nextSteps = Array.isArray(obj.nextSteps) ? obj.nextSteps : []
  const lines = [`:memo: *Call summary* — \`${shortId(obj.callId)}\``]
  lines.push(...(bullets.length ? bullets.map((b) => `• ${b}`) : ['_(no summary content)_']))
  if (nextSteps.length) lines.push('*Next steps:*', ...nextSteps.map((s) => `• ${s}`))
  return lines.join('\n')
}

const MAX_TRANSCRIPT_CHARS = 3500

function fmtTranscript(obj) {
  const dialogue = Array.isArray(obj.dialogue) ? obj.dialogue : []
  if (!dialogue.length) return `:scroll: *Call transcript* — \`${shortId(obj.callId)}\`\n_(empty transcript)_`

  const body = dialogue.map((seg) => `*${seg.identifier || seg.userId || 'unknown'}:* ${seg.content || ''}`).join('\n')
  const truncated = body.length > MAX_TRANSCRIPT_CHARS
  const text = truncated ? `${body.slice(0, MAX_TRANSCRIPT_CHARS)}…` : body

  return (
    `:scroll: *Call transcript* — \`${shortId(obj.callId)}\`\n${text}` +
    (truncated ? `\n_(truncated — ${dialogue.length} segments total)_` : '')
  )
}

const HANDLERS = {
  'call.completed': fmtCall,
  'call.summary.completed': fmtSummary,
  'call.transcript.completed': fmtTranscript,
}

async function postToSlack(text) {
  const token = process.env.QUO_SLACK_BOT_TOKEN
  const channel = process.env.QUO_SLACK_CHANNEL_CALLS || SLACK_CHANNEL_FALLBACK
  if (!token) return { ok: false, error: 'missing_slack_token' }

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
  const format = HANDLERS[eventType]
  if (!format) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'ignored_event', event: eventType || null })
  }

  const obj = body?.data?.object || body?.data || {}

  // If a phone-number filter is configured, drop traffic from any other line.
  // (call.summary/transcript payloads don't carry phoneNumberId, so this only
  // ever applies to call.completed.)
  const wantedLine = process.env.QUO_PHONE_NUMBER_ID
  if (wantedLine && obj.phoneNumberId && obj.phoneNumberId !== wantedLine) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'other_line' })
  }

  const text = `${format(obj)}\n_Reply from the Quo app — this is a read-only relay._`
  const slack = await postToSlack(text)
  return res.status(200).json({ ok: true, event: eventType, relayed: Boolean(slack.ok), slackError: slack.ok ? null : slack.error || null })
}
