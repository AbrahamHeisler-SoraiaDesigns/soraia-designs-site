// Gmail API send, AS abe@soraiadesigns.com, for the audit sequencer (doc 15 §B).
// Reuses the same Google OAuth client as Drive (GOOGLE_DRIVE_CLIENT_ID/SECRET/
// REFRESH_TOKEN) — once that refresh token is re-consented with the gmail.send
// scope (see scripts/oauth/get-gmail-refresh-token.mjs).
//
// Design rules baked in:
//  - Flag-on-success (Maya build-spec §1, the "flag-lies" fix): callers write
//    HubSpot send-flags ONLY on a returned messageId. A throw or a dryRun result
//    must NEVER be recorded as a delivered send.
//  - Plain text only (doc 14: promotional HTML/CTA/tracking fingerprint is itself
//    the spam signal that drove ~37% zero-open rates).
//  - DRY_RUN (SEQUENCER_DRY_RUN=1): build the send-plan without sending. The
//    message is logged and { dryRun:true, messageId:null } returned, so Maya can
//    review DRYRUN_SEND_PLAN.md before the first live run (G-MAYA gate).

const SENDER_EMAIL = process.env.SEQUENCER_FROM_EMAIL || 'abe@soraiadesigns.com'
const SENDER_NAME = process.env.SEQUENCER_FROM_NAME || 'Abe Heisler'

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

// RFC 5322 message → base64url, per Gmail API users.messages.send.
function buildRawMessage({ to, subject, text, replyTo, inReplyTo, references, headers = {} }) {
  const encHeader = (s) => `=?UTF-8?B?${Buffer.from(String(s), 'utf8').toString('base64')}?=`
  const lines = [
    `From: ${SENDER_NAME} <${SENDER_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${encHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
  ]
  if (replyTo) lines.push(`Reply-To: ${replyTo}`)
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`)
  if (references) lines.push(`References: ${references}`)
  for (const [k, v] of Object.entries(headers)) lines.push(`${k}: ${v}`)
  const bodyB64 = Buffer.from(String(text), 'utf8').toString('base64')
  const raw = `${lines.join('\r\n')}\r\n\r\n${bodyB64}`
  return Buffer.from(raw, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Send as abe@ via Gmail API. Returns { messageId, threadId } on a real send, or
// { dryRun:true, messageId:null } under DRY_RUN. Throws on any failure — callers
// must NOT write success flags on a throw or a dryRun.
export async function sendGmailAs({ to, subject, text, replyTo, inReplyTo, references, threadId, headers }) {
  if (!to || !subject || !text) throw new Error('gmail: to, subject, and text are required')

  if (isDryRun()) {
    console.log('[gmail][DRY_RUN] would send', JSON.stringify({ to, subject, bytes: String(text).length, threadId: threadId || null }))
    return { dryRun: true, messageId: null, threadId: threadId || null, to, subject }
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
  return { messageId: json.id, threadId: json.threadId || null, dryRun: false }
}

// Reply-awareness primitive (build-spec §4): does the lead's Gmail thread contain
// an inbound message FROM the lead? The sequencer pre-send gate STOPs on true.
export async function threadHasInboundFrom(threadId, leadEmail) {
  if (!threadId || !leadEmail) return false
  const accessToken = await getAccessToken()
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=From`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`gmail: thread get ${res.status}: ${await res.text()}`)
  const json = await res.json()
  const needle = String(leadEmail).toLowerCase()
  return (json.messages || []).some((m) => {
    const from = (m.payload?.headers || []).find((h) => h.name === 'From')?.value || ''
    return from.toLowerCase().includes(needle)
  })
}
