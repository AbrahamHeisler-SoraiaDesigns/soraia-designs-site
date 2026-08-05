// Upload validation + resumable-session minting for the client intake form.
//
// Files never pass through Vercel. Serverless functions cap request bodies at
// ~4.5 MB and clients send phone photos many times that, so this endpoint hands
// the browser a Drive resumable session URI and the browser PUTs the bytes
// straight to Google.
//
// THE ORIGIN HEADER IS LOAD-BEARING. Google binds CORS permission to a resumable
// session at INITIATION time. If the initiating POST omits Origin, the browser's
// later PUT dies at preflight with a bare "TypeError: Failed to fetch". Proven in
// real Chrome 2026-08-04 — see the scope doc §6.1.
//
// Two ways that fact hides from you, both of which cost me time:
//   * `curl -X OPTIONS` against the session URI returns access-control-allow-origin
//     for ANY origin, including sessions a browser then refuses. It tests nothing.
//   * A cross-origin GET to the session URI returns a readable 405, which looks
//     like working CORS — but GET is a simple request and skips preflight entirely.
import { getAccessToken } from './drive.js'

// Only origins we actually serve the form from. Echoing back whatever arrives
// would let any site mint an upload handle into a client's Drive folder.
const STATIC_ORIGINS = new Set([
  'https://soraiadesigns.com',
  'https://www.soraiadesigns.com',
])

export function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false
  if (STATIC_ORIGINS.has(origin)) return true
  // Vercel preview deploys for this project, so a PR can be tested end to end.
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true
  // Local dev only when explicitly enabled — never in production.
  if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) return true
  return false
}

// 100 MB/file matches what the Notion form allowed, so no client who could upload
// before is turned away now.
export const MAX_FILE_BYTES = 100 * 1024 * 1024

const IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/tiff']
const PDF = ['application/pdf']
// Floor plans arrive as CAD exports often enough to be worth naming. Martin Hill's
// folder has a .dwg in it; browsers usually send those as octet-stream.
const PLAN = [...IMAGE, ...PDF, 'image/vnd.dwg', 'application/acad', 'application/dxf', 'application/octet-stream']

export const ALLOWED_TYPES = {
  inspiration: [...IMAGE, ...PDF],
  property_photos: [...IMAGE, ...PDF],
  floor_plans: PLAN,
}

// Browsers do not always know a file's type. HEIC off a phone, and CAD exports,
// commonly arrive with an empty `file.type`, and the client then sends
// application/octet-stream. Rejecting that outright made the REQUIRED inspiration
// question unsubmittable for those clients, which is the worst place to be strict.
// So an untyped file is judged by its extension instead of being refused.
const UNTYPED = ['', 'application/octet-stream', 'binary/octet-stream']

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'tif', 'tiff']
const DOC_EXT = ['pdf']
const PLAN_EXT = [...IMAGE_EXT, ...DOC_EXT, 'dwg', 'dxf']

export const ALLOWED_EXTENSIONS = {
  inspiration: [...IMAGE_EXT, ...DOC_EXT],
  property_photos: [...IMAGE_EXT, ...DOC_EXT],
  floor_plans: PLAN_EXT,
}

export function extensionOf(filename) {
  const m = String(filename || '').toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

/** Strip anything that could escape the intended folder or confuse Drive. */
export function sanitizeFilename(name) {
  const base = String(name || '')
    .split(/[/\\]/).pop()                 // defeat path traversal
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, '')     // control chars
    .replace(/^\.+/, '')                   // no leading dots -> no hidden/relative names
    .trim()
  const cleaned = base.slice(0, 200)
  return cleaned || 'upload'
}

/**
 * Validate one requested upload. Returns {ok:true} or {ok:false, reason, message}.
 * Pure — no network — so the rules are unit-testable.
 */
export function validateUpload({ kind, contentType, size, filename }) {
  const allowed = ALLOWED_TYPES[kind]
  if (!allowed) return { ok: false, reason: 'bad_kind', message: `Unknown upload kind "${kind}"` }

  const type = String(contentType || '').toLowerCase().split(';')[0].trim()
  if (!allowed.includes(type)) {
    // Untyped file: fall back to the extension so a HEIC or a .dwg is not turned
    // away for something the browser failed to tell us.
    if (UNTYPED.includes(type)) {
      const ext = extensionOf(filename)
      if (!ext || !ALLOWED_EXTENSIONS[kind].includes(ext)) {
        return {
          ok: false,
          reason: 'bad_type',
          message: ext
            ? `.${ext} files are not accepted for ${kind}`
            : 'We could not tell what kind of file that is. Try a JPG, PNG, HEIC, or PDF.',
        }
      }
    } else {
      return { ok: false, reason: 'bad_type', message: `${type} is not accepted for ${kind}` }
    }
  }

  const bytes = Number(size)
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return { ok: false, reason: 'bad_size', message: 'size must be a positive number' }
  }
  if (bytes > MAX_FILE_BYTES) {
    return {
      ok: false,
      reason: 'too_large',
      message: `File is ${(bytes / 1048576).toFixed(1)} MB; the limit is ${MAX_FILE_BYTES / 1048576} MB`,
    }
  }
  return { ok: true }
}

/**
 * Ask Drive for a resumable upload session the browser can PUT to.
 * `origin` MUST be the browser's origin — see the header comment.
 */
export async function createResumableSession({ filename, contentType, size, parentId, origin }) {
  const token = await getAccessToken()
  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': contentType,
        'X-Upload-Content-Length': String(size),
        Origin: origin,
      },
      body: JSON.stringify({ name: filename, parents: [parentId] }),
    },
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Drive resumable init failed ${res.status}: ${text.slice(0, 300)}`)
  }
  const uploadUrl = res.headers.get('location')
  if (!uploadUrl) throw new Error('Drive resumable init returned no Location header')
  // If Google did not echo the origin back, the browser PUT will fail at preflight.
  // Better to fail here, where the reason is legible, than to hand the client a
  // session that dies with an opaque "Failed to fetch".
  const acao = res.headers.get('access-control-allow-origin')
  if (!acao) {
    throw new Error(`Drive did not grant CORS for origin ${origin} — the browser upload would be blocked`)
  }
  return { uploadUrl }
}
