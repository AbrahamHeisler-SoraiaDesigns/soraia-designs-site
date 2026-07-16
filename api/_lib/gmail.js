// Gmail API send, AS abe@soraiadesigns.com, for the audit sequencer (doc 15 §B).
// Reuses the same Google OAuth client as Drive (GOOGLE_DRIVE_CLIENT_ID/SECRET/
// REFRESH_TOKEN) — once that refresh token is re-consented with the gmail.send
// scope (see scripts/oauth/get-gmail-refresh-token.mjs).
//
// Design rules baked in:
//  - Flag-on-success (Maya build-spec §1, the "flag-lies" fix): callers write
//    HubSpot send-flags ONLY when result.status === 'sent' with a messageId. A
//    throw or a dryRun result must NEVER be recorded as a delivered send.
//  - Plain text only (doc 14: promotional HTML/CTA/tracking fingerprint is itself
//    the spam signal behind the ~37% zero-open rates).
//  - DRY_RUN (SEQUENCER_DRY_RUN=1): build the send-plan without sending; the
//    message is logged and { status:'dryRun', messageId:null } returned, so Maya
//    can review DRYRUN_SEND_PLAN.md before the first live run (G-MAYA gate).

const SENDER_EMAIL = process.env.SEQUENCER_FROM_EMAIL || 'abe@soraiadesigns.com'
const SENDER_NAME = process.env.SEQUENCER_FROM_NAME || 'Abe Heisler'
const CRLF = String.fromCharCode(13, 10)

function required(name) {
  const v = process.env[name]
  if (!v) throw new Error(`gmail: missing env ${name}`)
  return v
}

export function isDryRun() {
  return process.env.SEQUENCER_DRY_RUN === '1' || process.env.SEQUENCER_DRY_RUN === 'true'
}

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: required('GOOGLE_DRIVE_CLIENT_ID'),
      client_secret: required('GOOGLE_DRIVE_CLIENT_SECRET'),
      refresh_token: required('GOOGLE_DRIVE_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`gmail: token refresh ${res.status}: ${await res.text()}`)
  const json = await res.json()
  if (!json.access_token) throw new Error('gmail: no access_token in refresh response')
  return json.access_token
}

// Header-injection guard. `to`/`replyTo`/`references`/custom headers can carry
// lead-submitted data (upstream only lowercases it), so a value with CR/LF/NUL
// could inject headers (Bcc) or terminate the header block and inject body
// content. Fail loud rather than silently strip. (Char-code check, not a regex,
// to keep the forbidden bytes unambiguous.)
function assertHeaderSafe(value, field) {
  const s = String(value)
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i)
    if (c === 13 || c === 10 || c === 0) {
      throw new Error(`gmail: illegal control char (CR/LF/NUL) in header "${field}"`)
    }
  }
  return s
}

// RFC 2047 base64 for non-ASCII header text (subject).
function encHeaderText(s) {
  return `=?UTF-8?B?${Buffer.from(String(s), 'utf8').toString('base64')}?=`
}

// base64 wrapped at 76 chars per RFC 2045 §6.8.
function wrap76(b64) {
  return b64.match(/.{1,76}/g)?.join(CRLF) ?? b64
}

// RFC 5322 message → base64url, per Gmail API users.messages.send.
function buildRawMessage({ to, subject, text, replyTo, inReplyTo, references, headers = {} }) {
  const lines = [
    `From: ${SENDER_NAME} <${SENDER_EMAIL}>`, // controlled config, not lead data
    `To: ${assertHeaderSafe(to, 'To')}`,
    `Subject: ${encHeaderText(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
  ]
  if (replyTo) lines.push(`Reply-To: ${assertHeaderSafe(replyTo, 'Reply-To')}`)
  if (inReplyTo) lines.push(`In-Reply-To: ${assertHeaderSafe(inReplyTo, 'In-Reply-To')}`)
  if (references) lines.push(`References: ${assertHeaderSafe(references, 'References')}`)
  for (const [k, v] of Object.entries(headers)) {
    lines.push(`${assertHeaderSafe(k, 'header-name')}: ${assertHeaderSafe(v, k)}`)
  }
  const bodyB64 = wrap76(Buffer.from(String(text), 'utf8').toString('base64'))
  const raw = `${lines.join(CRLF)}${CRLF}${CRLF}${bodyB64}`
  return Buffer.from(raw, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Send as abe@ via Gmail API. Returns { status:'sent', messageId, threadId } on a
// confirmed 2xx, or { status:'dryRun', messageId:null } under DRY_RUN. Throws on
// any failure. Callers MUST gate success on status === 'sent' (not on the mere
// presence of a messageId key) before writing HubSpot flags.
export async function sendGmailAs({ to, subject, text, replyTo, inReplyTo, references, threadId, headers }) {
  if (!to || !subject || !text) throw new Error('gmail: to, subject, and text are required')

  if (isDryRun()) {
    const bytes = Buffer.byteLength(String(text), 'utf8')
    console.log('[gmail][DRY_RUN] would send', JSON.stringify({ to, subject, bytes, threadId: threadId || null }))
    return { status: 'dryRun', messageId: null, threadId: threadId || null, to, subject }
  }

  const accessToken = await getAccessToken()
  const raw = buildRawMessage({ to, subject, text, replyTo, inReplyTo, references, headers })
  const payload = threadId ? { raw, threadId } : { raw }
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`gmail: send ${res.status}: ${await res.text()}`)
  const json = await res.json()
  if (!json.id) throw new Error('gmail: send returned no message id')
  return { status: 'sent', messageId: json.id, threadId: json.threadId || null }
}

// Normalize an address for reply matching. Gmail/Googlemail ignore dots and
// +suffixes in the local part; strip +suffix for all providers (same human).
// Prevents the sequencer from missing a genuine reply and re-sending — the exact
// failure mode build-spec §4 / the Esther post-mortem must make impossible.
function normalizeEmail(email) {
  const raw = String(email).trim().toLowerCase()
  const at = raw.lastIndexOf('@')
  if (at < 1) return raw
  let local = raw.slice(0, at)
  let domain = raw.slice(at + 1)
  if (domain === 'googlemail.com') domain = 'gmail.com'
  local = local.split('+')[0]
  if (domain === 'gmail.com') local = local.replace(/\./g, '')
  return `${local}@${domain}`
}

function addressFromHeader(headerValue) {
  const m = String(headerValue).match(/<([^>]+)>/)
  return m ? m[1] : String(headerValue)
}

// Reply-awareness primitive (build-spec §4): does the lead's Gmail thread contain
// an inbound message FROM the lead? The sequencer pre-send gate STOPs on true.
export async function threadHasInboundFrom(threadId, leadEmail) {
  if (!threadId || !leadEmail) return false
  const target = normalizeEmail(leadEmail)
  const accessToken = await getAccessToken()
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=From`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`gmail: thread get ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return (json.messages || []).some((m) => {
    const from = (m.payload?.headers || []).find((h) => h.name === 'From')?.value || ''
    return normalizeEmail(addressFromHeader(from)) === target
  })
}

// Reply-aware pre-send gate (build-spec §4), search-based so it needs no stored
// thread id and catches replies even if threading broke. True if abe@'s mailbox
// has ANY inbound message from the lead in the window. The sequencer STOPs on true
// (→ paused_reply), making the Esther "goodbye-then-cold-pitch" collision
// structurally impossible.
export async function hasRecentInboundFrom(leadEmail, days = 60) {
  if (!leadEmail) return false
  const accessToken = await getAccessToken()
  const q = encodeURIComponent(`from:${String(leadEmail).trim()} newer_than:${days}d`)
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`gmail: message list ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return (json.resultSizeEstimate || 0) > 0 || (Array.isArray(json.messages) && json.messages.length > 0)
}

// Exported for unit tests.
export const __test = { buildRawMessage, assertHeaderSafe, normalizeEmail }
