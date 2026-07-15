// Meta Pixel advanced-matching helpers.
//
// The problem (Maya's 7/15 attribution audit): the browser Lead fired with EMPTY
// user data — `fbq('track','Lead',{},{eventID})` — so Event Match Quality was
// near zero and Ads Manager attributed only ~3 of ~8 paid leads. The form has
// already collected email + name at this point; feeding them as advanced matching
// lets Meta join the Lead to the ad click.
//
// CRITICAL: the browser pixel SHA-256 hashes advanced-matching values ITSELF.
// Pass NORMALIZED PLAINTEXT here — never pre-hash (pre-hashing double-hashes and
// breaks matching). The server-side CAPI leg (api/audit-submit.js) pre-hashes
// separately; the two stay consistent because both normalize the same way and
// dedup on a shared event_id.

// Build the advanced-matching object from what the form has. Plaintext + normalized.
export function buildAdvancedMatching({ email, full_name, phone } = {}) {
  const am = {}
  const em = String(email || '').trim().toLowerCase()
  if (em) {
    am.em = em
    // external_id hashes (client-side) to sha256(email), matching the server
    // CAPI's external_id = sha256Hex(email) — an extra join key.
    am.external_id = em
  }
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits) am.ph = digits
  const parts = String(full_name || '').trim().split(/\s+/).filter(Boolean)
  if (parts[0]) am.fn = parts[0].toLowerCase()
  if (parts.length > 1) am.ln = parts.slice(1).join(' ').toLowerCase()
  return am
}

// Fire the Lead event with advanced matching, deduplicated against the server
// CAPI Lead via the shared eventId. Re-calling init merges the AM data into the
// pixel; init does NOT fire a PageView, so there's no double-count. No-op if fbq
// is absent (ad blocker / opt-out). Returns true if the track call was made.
export function fireLeadWithMatching(fbq, { pixelId, email, full_name, phone, eventId }) {
  if (typeof fbq !== 'function') return false
  const am = buildAdvancedMatching({ email, full_name, phone })
  if (Object.keys(am).length > 0) fbq('init', pixelId, am)
  fbq('track', 'Lead', {}, eventId ? { eventID: eventId } : undefined)
  return true
}
