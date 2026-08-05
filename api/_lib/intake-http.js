// Shared request plumbing for the intake endpoints, so /api/intake-upload-url and
// /api/intake-submit cannot drift apart on the two things that must match exactly:
// which origins may talk to them, and what a client is told when their link fails.
import { isAllowedOrigin } from './intake-upload.js'

// Token problems a client can act on vs ones they can't. 'expired' is the common
// real-world case (kickoff email opened five weeks late) and deserves an answer
// that tells them what to do, not a bare 403.
export const TOKEN_STATUS = {
  missing: [401, 'This link is missing its access token. Use the link from your kickoff email.'],
  malformed: [401, 'This link looks damaged. Use the link from your kickoff email.'],
  bad_signature: [403, 'This link is not valid.'],
  wrong_version: [401, 'This link is out of date. Ask us for a fresh one.'],
  incomplete: [401, 'This link is not valid.'],
  expired: [401, 'This link has expired. Ask us for a fresh one and we will send it right over.'],
  server_misconfigured: [503, 'Uploads are temporarily unavailable. We have been notified.'],
}

export function tokenFailureResponse(res, verdict) {
  const [status, message] = TOKEN_STATUS[verdict.reason] || [401, 'This link is not valid.']
  if (verdict.reason === 'server_misconfigured') {
    console.error('[intake] token secret misconfigured:', verdict.detail)
  }
  return res.status(status).json({ ok: false, reason: verdict.reason, message })
}

/**
 * Apply CORS and handle preflight. Returns {origin, handled} — when `handled` is
 * true the response is already sent and the caller must return immediately.
 *
 * The origin is not decoration on these routes: intake-upload-url forwards it to
 * Google, where it becomes the only origin allowed to write the bytes. So both
 * routes allowlist rather than echo.
 */
export function applyIntakeCors(req, res, methods = 'POST, OPTIONS') {
  const origin = req.headers.origin || ''
  const allowed = isAllowedOrigin(origin)
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', methods)
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    res.status(204).end()
    return { origin, allowed, handled: true }
  }
  return { origin, allowed, handled: false }
}

/** Parse a JSON body that Vercel may hand over as a string. Returns null on bad JSON. */
export function parseJsonBody(req) {
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return null
    }
  }
  return body || {}
}
