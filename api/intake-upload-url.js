// Hands the browser a Drive resumable upload session for one intake file.
//
// The bytes never touch Vercel — see api/_lib/intake-upload.js for why, and for
// the Origin-header trap that makes browser-side uploads work at all.
import { verifyIntakeToken } from './_lib/intake-token.js'
import { assertClientFolder, resolveUploadTarget } from './_lib/intake-drive.js'
import {
  createResumableSession,
  isAllowedOrigin,
  sanitizeFilename,
  validateUpload,
} from './_lib/intake-upload.js'

// Token problems a client can act on vs ones they can't. 'expired' is the common
// real-world case (kickoff email opened five weeks late) and deserves an answer
// that tells them what to do, not a bare 403.
const TOKEN_STATUS = {
  missing: [401, 'This link is missing its access token. Use the link from your kickoff email.'],
  malformed: [401, 'This link looks damaged. Use the link from your kickoff email.'],
  bad_signature: [403, 'This link is not valid.'],
  wrong_version: [401, 'This link is out of date. Ask us for a fresh one.'],
  incomplete: [401, 'This link is not valid.'],
  expired: [401, 'This link has expired. Ask us for a fresh one and we will send it right over.'],
  server_misconfigured: [503, 'Uploads are temporarily unavailable. We have been notified.'],
}

export default async function handler(req, res) {
  const origin = req.headers.origin || ''
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  // The origin is not decoration here: it is forwarded to Google and becomes the
  // only origin allowed to PUT the bytes. An unvalidated one would let any site
  // mint a write handle into a client's folder.
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ ok: false, message: 'Origin not allowed' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ ok: false, message: 'Invalid JSON body' })
    }
  }
  body = body || {}

  const verdict = verifyIntakeToken(body.token)
  if (!verdict.ok) {
    const [status, message] = TOKEN_STATUS[verdict.reason] || [401, 'This link is not valid.']
    if (verdict.reason === 'server_misconfigured') {
      console.error('[intake-upload-url] token secret misconfigured:', verdict.detail)
    }
    return res.status(status).json({ ok: false, reason: verdict.reason, message })
  }
  const { dealId, folderId, clientName } = verdict.payload

  const check = validateUpload({ kind: body.kind, contentType: body.contentType, size: body.size })
  if (!check.ok) {
    return res.status(400).json({ ok: false, reason: check.reason, message: check.message })
  }

  const filename = sanitizeFilename(body.filename)

  try {
    await assertClientFolder(folderId)
    const target = await resolveUploadTarget(folderId, body.kind)
    const { uploadUrl } = await createResumableSession({
      filename,
      contentType: body.contentType,
      size: Number(body.size),
      parentId: target.id,
      origin,
    })
    if (target.created) {
      // Worth a log line: it means this client's folder was missing part of the
      // template and we just repaired it.
      console.log(`[intake-upload-url] created missing "${target.name}" for deal ${dealId} (${clientName})`)
    }
    return res.status(200).json({ ok: true, uploadUrl, filename, folder: target.name })
  } catch (err) {
    console.error(`[intake-upload-url] failed for deal ${dealId} kind=${body.kind}:`, err)
    return res.status(502).json({
      ok: false,
      reason: 'drive_failed',
      message: 'We could not start that upload. Please try again in a moment.',
    })
  }
}
