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
  // Single-recipient guard (defense-in-depth): a comma-joined address string is
  // valid RFC822 and would silently add recipients. The sequencer always sends to
  // exactly one lead, so reject any address list.
  if (String(to).includes(',')) throw new Error('gmail: to must be a single recipient')

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

// Our own domain. Addresses here are US (Abe, Soraia, Lis, Barbara), never the
// lead — without this, a thread where Abe loops in the team would read as "the
// lead replied" and park a live lead forever.
const OUR_DOMAIN = String(SENDER_EMAIL).toLowerCase().split('@')[1] || 'soraiadesigns.com'

function isOurDomain(address) {
  const n = normalizeEmail(address)
  const at = n.lastIndexOf('@')
  return at > 0 && n.slice(at + 1) === OUR_DOMAIN
}

// How many threads to walk in pass 2. Bounded because this runs per-lead on a
// cron: a lead with a long history should cost a predictable number of calls.
const THREAD_SCAN_LIMIT = 10

async function gmailGet(accessToken, path) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`gmail: ${path.split('?')[0]} ${res.status}: ${await res.text()}`)
  return res.json()
}

// Pass 1 — the lead replied from the address we have on file. Cheap, one call,
// and it is the common case.
async function inboundByAddress(accessToken, leadEmail, days) {
  const q = encodeURIComponent(`from:${String(leadEmail).trim()} newer_than:${days}d`)
  const json = await gmailGet(accessToken, `messages?q=${q}&maxResults=1`)
  return (json.resultSizeEstimate || 0) > 0 || (Array.isArray(json.messages) && json.messages.length > 0)
}

// Pass 2 — the lead replied from a DIFFERENT address than the one they signed up
// with. Pass 1 cannot see this, and it is not hypothetical: Eve Alpern's intake
// address was hello@saltystaysmaine.com and she replied twice from
// evealpern@gmail.com (2026-08-06). The gate missed both, left her `active` at
// email_4_math, and queued the goodbye email at a lead who had just written in
// asking to book.
//
// So instead of trusting the address, trust the THREAD: find threads we addressed
// to the lead, and treat any message on them from outside our own domain as a
// reply. That catches an alternate address, a spouse, an assistant, or anyone the
// lead hands the conversation to.
async function inboundOnOurThreads(accessToken, leadEmail, days, cutoffMs) {
  const q = encodeURIComponent(`to:${String(leadEmail).trim()} newer_than:${days}d`)
  const list = await gmailGet(accessToken, `threads?q=${q}&maxResults=${THREAD_SCAN_LIMIT}`)
  for (const thread of list.threads || []) {
    const full = await gmailGet(
      accessToken,
      `threads/${thread.id}?format=metadata&metadataHeaders=From`
    )
    for (const m of full.messages || []) {
      // A thread can be older than the window even when the search matched it on a
      // recent message. Without this the re-engage release path breaks: a lead is
      // parked BECAUSE they wrote "not now", so counting that original reply would
      // suppress the release send every single time.
      if (cutoffMs && Number(m.internalDate || 0) < cutoffMs) continue
      const from = (m.payload?.headers || []).find((h) => h.name === 'From')?.value || ''
      const address = addressFromHeader(from)
      if (!address) continue
      if (!isOurDomain(address)) return true
    }
  }
  return false
}

// Reply-aware pre-send gate (build-spec §4), search-based so it needs no stored
// thread id and catches replies even if threading broke. True if abe@'s mailbox
// shows the lead engaged in the window, by either of two routes (see above). The
// sequencer STOPs on true (→ paused_reply), making the Esther
// "goodbye-then-cold-pitch" collision structurally impossible.
export async function hasRecentInboundFrom(leadEmail, days = 60) {
  if (!leadEmail) return false
  const windowDays = Math.max(1, Number(days) || 60)
  const cutoffMs = Date.now() - windowDays * 24 * 60 * 60 * 1000
  const accessToken = await getAccessToken()
  if (await inboundByAddress(accessToken, leadEmail, windowDays)) return true
  return inboundOnOurThreads(accessToken, leadEmail, windowDays, cutoffMs)
}

// Exported for unit tests.
export const __test = {
  buildRawMessage,
  assertHeaderSafe,
  normalizeEmail,
  isOurDomain,
  inboundOnOurThreads,
}
