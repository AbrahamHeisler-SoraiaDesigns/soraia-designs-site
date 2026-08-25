// First-touch attribution stash.
//
// Ads land on /audit with utms in the query string, but every in-page CTA is a
// react-router <Link> that drops the query. By the time the form submits,
// window.location.search is empty and HubSpot records blank utm props, which is
// why paid leads were classifying as SOCIAL_MEDIA off the referrer instead of
// PAID_SOCIAL. Stash the first tagged landing for the session and read it back
// wherever attribution is needed.
//
// First touch wins: once a stash exists it is never overwritten, so a lead who
// arrives on a Meta ad and later opens a nurture email keeps meta as the
// acquisition source. Live query params still take precedence at read time, so
// nurture links keep winning attribution on their own clicks.

const STASH_KEY = 'sd_first_touch'

const STASHED_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
]

function readStash() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STASH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    // Storage disabled, private mode, or malformed JSON. Attribution degrades to
    // live params only, which is the behavior we had before this stash existed.
    return null
  }
}

// Call once per hard load, before render. A no-op unless the URL carries a
// utm_source and the session has no stash yet.
export function captureFirstTouch() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (!params.get('utm_source')) return
  if (readStash()) return

  const stash = { landing_page: window.location.href }
  for (const key of STASHED_PARAMS) stash[key] = params.get(key) || ''

  try {
    window.sessionStorage.setItem(STASH_KEY, JSON.stringify(stash))
  } catch {
    // Same failure modes as readStash. Nothing to recover.
  }
}

export function getFirstTouch() {
  return readStash() || {}
}
