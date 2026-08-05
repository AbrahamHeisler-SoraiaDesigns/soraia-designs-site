// Browser half of the intake upload. Two hops per file:
//   1. POST /api/intake-upload-url  -> a Drive resumable session URI
//   2. PUT the bytes straight to Google
//
// The bytes never touch our server — Vercel caps request bodies at ~4.5 MB and a
// single phone photo can exceed that. See api/_lib/intake-upload.js for the
// Origin-header trap that makes step 2 work at all.

/** Matches the server's per-kind allowlists, so the file picker offers the right types. */
export const ACCEPT = {
  inspiration: 'image/*,.pdf,.heic,.heif',
  property_photos: 'image/*,.pdf,.heic,.heif',
  floor_plans: 'image/*,.pdf,.heic,.heif,.dwg,.dxf',
}

export const MAX_FILE_BYTES = 100 * 1024 * 1024

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

/**
 * PUT the file to a Drive resumable session, reporting progress.
 *
 * XHR rather than fetch purely for upload progress events — fetch still cannot
 * report request-body progress in Safari, and a 40 MB photo with no feedback
 * reads as a hung page.
 */
function putBytes(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    // Must match the X-Upload-Content-Type declared when the session was minted.
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText || '{}'))
        } catch {
          resolve({})
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`))
      }
    }
    // A CORS rejection surfaces here with a status of 0 and no detail — the
    // classic symptom of a session minted without a forwarded Origin.
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))
    xhr.send(file)
  })
}

/**
 * Upload one file. Returns {id, name, url} shaped for the answers payload.
 * Throws with a message written for the client, not for a log.
 */
export async function uploadIntakeFile({ file, kind, token, onProgress }) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} is ${formatBytes(file.size)}. The limit is 100 MB.`)
  }

  const res = await fetch('/api/intake-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      kind,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.uploadUrl) {
    throw new Error(body.message || 'We could not start that upload. Please try again.')
  }

  if (onProgress) onProgress(0)
  const uploaded = await putBytes(body.uploadUrl, file, onProgress)
  if (onProgress) onProgress(100)

  const id = uploaded.id || null
  return {
    id,
    name: body.filename || file.name,
    url: id ? `https://drive.google.com/file/d/${id}/view` : null,
  }
}
