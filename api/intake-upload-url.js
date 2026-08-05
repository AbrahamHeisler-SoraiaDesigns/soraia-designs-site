// Hands the browser a Drive resumable upload session for one intake file.
//
// The bytes never touch Vercel — see api/_lib/intake-upload.js for why, and for
// the Origin-header trap that makes browser-side uploads work at all.
import { verifyIntakeToken } from './_lib/intake-token.js'
import { applyIntakeCors, parseJsonBody, tokenFailureResponse } from './_lib/intake-http.js'
import { assertClientFolder, resolveUploadTarget } from './_lib/intake-drive.js'
import { createResumableSession, sanitizeFilename, validateUpload } from './_lib/intake-upload.js'

export default async function handler(req, res) {
  const { origin, allowed, handled } = applyIntakeCors(req, res)
  if (handled) return undefined

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  // The origin is not decoration here: it is forwarded to Google and becomes the
  // only origin allowed to PUT the bytes. An unvalidated one would let any site
  // mint a write handle into a client's folder.
  if (!allowed) {
    return res.status(403).json({ ok: false, message: 'Origin not allowed' })
  }

  const body = parseJsonBody(req)
  if (body === null) {
    return res.status(400).json({ ok: false, message: 'Invalid JSON body' })
  }

  const verdict = verifyIntakeToken(body.token)
  if (!verdict.ok) return tokenFailureResponse(res, verdict)
  const { dealId, folderId, clientName } = verdict.payload

  // Sanitize before validating: an untyped file (HEIC off a phone, a CAD export)
  // is judged by its extension, so validation needs the cleaned name.
  const filename = sanitizeFilename(body.filename)

  const check = validateUpload({
    kind: body.kind,
    contentType: body.contentType,
    size: body.size,
    filename,
  })
  if (!check.ok) {
    return res.status(400).json({ ok: false, reason: check.reason, message: check.message })
  }

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
