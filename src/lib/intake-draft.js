// Save-and-resume for the intake form (settled with Abe 2026-08-04).
//
// 40 questions is more than one sitting for most people, and a client who loses
// half an hour of typing to a closed tab does not come back — they email photos
// instead, which is the behaviour this whole rebuild exists to end.
//
// Scoped to the deal id from the token, so two properties in one browser do not
// overwrite each other. Only completed uploads are persisted ({name,id,url});
// File objects are not serializable and the bytes already live in Drive.

const PREFIX = 'soraia_intake_draft:'
const VERSION = 1
// Long enough to survive a client coming back next weekend, short enough that a
// stale draft does not silently repopulate a form months later.
const MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000

function key(dealId) {
  return `${PREFIX}${dealId || 'unknown'}`
}

export function loadDraft(dealId) {
  if (typeof window === 'undefined' || !dealId) return null
  try {
    const raw = window.localStorage.getItem(key(dealId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.version !== VERSION) return null
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(key(dealId))
      return null
    }
    return { answers: parsed.answers || {}, savedAt: parsed.savedAt }
  } catch {
    // A corrupt or unavailable store must never block the form — Safari private
    // mode throws on localStorage access.
    return null
  }
}

export function saveDraft(dealId, answers) {
  if (typeof window === 'undefined' || !dealId) return false
  try {
    window.localStorage.setItem(
      key(dealId),
      JSON.stringify({ version: VERSION, savedAt: Date.now(), answers }),
    )
    return true
  } catch {
    return false
  }
}

export function clearDraft(dealId) {
  if (typeof window === 'undefined' || !dealId) return
  try {
    window.localStorage.removeItem(key(dealId))
  } catch {
    /* nothing to do — the draft is a convenience, not a record */
  }
}

/**
 * Read the deal id and client name out of the link token for scoping and the
 * greeting. The payload is signed, not encrypted, so this is a legitimate read —
 * but it is NOT a trust decision. Every real check happens server-side; a client
 * who edits this only changes which draft they see.
 */
export function peekToken(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const payloadB64 = token.split('.')[0]
    const pad = payloadB64.length % 4 === 0 ? '' : '='.repeat(4 - (payloadB64.length % 4))
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/') + pad)
    const p = JSON.parse(json)
    return {
      dealId: p.deal || null,
      clientName: p.name || '',
      expiresAt: typeof p.exp === 'number' ? p.exp * 1000 : null,
    }
  } catch {
    return null
  }
}
