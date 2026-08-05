// Signed, per-client links for the onboarding intake form.
//
// Why a token instead of ?deal=<id>: the intake endpoints write files into a real
// client folder in Drive. A guessable or enumerable URL would be an open file drop
// into "04 — Clients". The token binds one link to one deal + one folder, is
// tamper-evident, and expires.
//
// The token carries the FOLDER ID, not just the deal id, on purpose. June already
// holds folder ids in her ledger (~/.hermes/state/soraia-fulfillment/projects.json)
// and her folder-naming rules have real exceptions in them — "Frank - Client Folder"
// is not "Frank Sarlo — Client Folder", and a contact labelled "Referred by" is the
// realtor, not the client. Re-deriving that on Vercel would mean duplicating logic
// that is already hard-won and occasionally wrong. Signing the resolved id instead
// means the naming rules live in exactly one place.
//
// Format: base64url(payload).base64url(hmac-sha256)   — compact, URL-safe, opaque.
import crypto from 'node:crypto'

export const TOKEN_VERSION = 1
// 30 days. Long enough that a client who opens the kickoff email two weeks late
// still lands on a working form; short enough that a link leaked from an old inbox
// is not a permanent write handle.
export const DEFAULT_TTL_DAYS = 30

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

export function requireTokenSecret() {
  const secret = process.env.INTAKE_TOKEN_SECRET
  // Fail loudly. A default or empty secret would make every token forgeable while
  // still looking like it works, which is the worst possible failure mode here.
  if (!secret || secret.length < 32) {
    throw new Error('INTAKE_TOKEN_SECRET missing or too short (need >= 32 chars)')
  }
  return secret
}

function sign(payloadB64, secret) {
  return b64urlEncode(crypto.createHmac('sha256', secret).update(payloadB64).digest())
}

/**
 * Mint a link token for one client.
 * @param {{dealId: string, folderId: string, clientName?: string, ttlDays?: number, now?: number}} input
 */
export function signIntakeToken({ dealId, folderId, clientName = '', ttlDays = DEFAULT_TTL_DAYS, now = Date.now() }) {
  if (!dealId) throw new Error('signIntakeToken: dealId required')
  if (!folderId) throw new Error('signIntakeToken: folderId required')
  const secret = requireTokenSecret()
  const payload = {
    v: TOKEN_VERSION,
    deal: String(dealId),
    folder: String(folderId),
    name: String(clientName || ''),
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + Math.round(ttlDays * 86400),
  }
  const payloadB64 = b64urlEncode(JSON.stringify(payload))
  return `${payloadB64}.${sign(payloadB64, secret)}`
}

/**
 * Verify a token. Returns {ok:true, payload} or {ok:false, reason}.
 *
 * Returns a result object rather than throwing so a handler can map reasons to
 * responses (expired -> "ask June for a fresh link", bad_signature -> 403) without
 * try/catch around every call.
 */
export function verifyIntakeToken(token, { now = Date.now() } = {}) {
  if (!token || typeof token !== 'string') return { ok: false, reason: 'missing' }
  const parts = token.split('.')
  if (parts.length !== 2) return { ok: false, reason: 'malformed' }
  const [payloadB64, sigB64] = parts
  if (!payloadB64 || !sigB64) return { ok: false, reason: 'malformed' }

  let secret
  try {
    secret = requireTokenSecret()
  } catch (err) {
    return { ok: false, reason: 'server_misconfigured', detail: err.message }
  }

  const expected = sign(payloadB64, secret)
  // Compare as fixed-length digest buffers. timingSafeEqual throws on a length
  // mismatch, and comparing the raw base64 strings would leak length via that throw.
  const a = Buffer.from(expected)
  const b = Buffer.from(sigB64)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_signature' }
  }

  let payload
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8'))
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (payload.v !== TOKEN_VERSION) return { ok: false, reason: 'wrong_version' }
  if (!payload.deal || !payload.folder) return { ok: false, reason: 'incomplete' }
  if (typeof payload.exp !== 'number') return { ok: false, reason: 'incomplete' }
  if (Math.floor(now / 1000) >= payload.exp) return { ok: false, reason: 'expired' }

  return {
    ok: true,
    payload: {
      dealId: payload.deal,
      folderId: payload.folder,
      clientName: payload.name || '',
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    },
  }
}

/** Full intake URL for a client. */
export function buildIntakeUrl(token, baseUrl = process.env.SITE_BASE_URL || 'https://soraiadesigns.com') {
  return `${String(baseUrl).replace(/\/+$/, '')}/intake?t=${encodeURIComponent(token)}`
}
