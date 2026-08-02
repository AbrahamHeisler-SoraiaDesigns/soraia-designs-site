// Calendly booking enrichment — Maya's 7/16 spec + her 7/26 attribution addendum.
//
// The native Calendly<->HubSpot integration creates the contact and the meeting within
// seconds, but it strands everything the intake form collected: phone, property address,
// investment stage, budget, and the self-reported source. Maya hand-copied two leads on
// 7/16 to prove the shape; this makes it automatic.
//
// Built as pure functions so the parsing is testable without a HubSpot round-trip. The
// webhook handler owns the I/O.

// Deal auto-create fires ONLY for the STR Launch Consult (slug `str-consult`). Audit
// Review / Next Steps and Follow Up bookings belong to a deal that already exists, so
// they enrich the contact and stop there. Default-deny: an event type we don't recognize
// gets enrichment, never a deal.
const STR_CONSULT_RE = /str[\s._-]*(launch[\s._-]*)?consult/i

// Verified against the live form 2026-08-02. Matched loosely because Calendly question
// text is Abe-editable — a renamed question should degrade to "lands in the note only",
// never to a crash or a silently-empty property write.
const Q = {
  phone: (q) => q.includes('phone'),
  address: (q) => q.includes('property address') || (q.includes('address') && !q.includes('email')),
  source: (q) => q.includes('how did you hear'),
}

export function answerRows(payload) {
  return Array.isArray(payload?.questions_and_answers) ? payload.questions_and_answers : []
}

function findAnswer(payload, matcher) {
  const row = answerRows(payload).find((item) =>
    matcher(String(item?.question || '').trim().toLowerCase())
  )
  return String(row?.answer || '').trim()
}

/**
 * Test bookings must never reach HubSpot. Two independent signals, either one skips:
 * the plus-addressed invitee Abe books with, and the audit_test flag already on the
 * contact from the audit funnel.
 */
export function isTestBooking(inviteeEmail, contact) {
  const email = String(inviteeEmail || '').trim().toLowerCase()
  if (/^abe\+/.test(email) && email.endsWith('@soraiadesigns.com')) return true
  const flag = contact?.audit_test
  return flag === true || String(flag || '').toLowerCase() === 'true'
}

export function isStrConsultEvent(eventTypeLabel) {
  return STR_CONSULT_RE.test(String(eventTypeLabel || ''))
}

/**
 * Best-effort US address split. Calendly gives one free-text line, so anything we can't
 * confidently parse goes into `address` whole rather than being smeared across the wrong
 * fields — a half-parsed address is worse than an unparsed one when Abe is reading it
 * off a contact record before a call.
 */
export function parsePropertyAddress(raw) {
  const value = String(raw || '').trim()
  if (!value) return {}

  // "123 Main St, Tampa, FL 33601" / "123 Main St, Tampa, FL" / trailing ", USA"
  const cleaned = value.replace(/,?\s*(usa|united states)\s*$/i, '').trim()
  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean)

  if (parts.length >= 3) {
    const tail = parts[parts.length - 1]
    const stateZip = tail.match(/^([A-Za-z]{2})\.?\s+(\d{5})(?:-\d{4})?$/)
    const stateOnly = tail.match(/^([A-Za-z]{2})\.?$/)
    if (stateZip) {
      return {
        address: parts.slice(0, -2).join(', '),
        city: parts[parts.length - 2],
        state: stateZip[1].toUpperCase(),
        zip: stateZip[2],
      }
    }
    if (stateOnly) {
      return {
        address: parts.slice(0, -2).join(', '),
        city: parts[parts.length - 2],
        state: stateOnly[1].toUpperCase(),
      }
    }
  }

  return { address: cleaned }
}

/**
 * UTMs as Calendly reports them. Maya's 7/26 method: self-report cross-referenced against
 * UTMs separates real click-through from view-through/ad-assisted (self-report says "ad"
 * + every UTM null = view-through, first confirmed on Purnam Sheth). Both halves have to
 * land on the contact or Friday paid reads go back to manual API pulls.
 */
export function trackingSummary(payload) {
  const t = payload?.tracking || {}
  const fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  const present = fields
    .map((f) => [f, String(t[f] ?? '').trim()])
    .filter(([, v]) => v && v !== 'null')
  if (present.length === 0) return { line: 'UTMs: none (all null)', hasUtms: false }
  return {
    line: `UTMs: ${present.map(([k, v]) => `${k}=${v}`).join(' · ')}`,
    hasUtms: true,
  }
}

/** Contact properties derived from the booking. Only non-empty values are returned. */
export function enrichmentPropsFromInvitee(payload) {
  const props = {}

  const phone = findAnswer(payload, Q.phone) || String(payload?.text_reminder_number || '').trim()
  if (phone) props.phone = phone

  const parsed = parsePropertyAddress(findAnswer(payload, Q.address))
  if (parsed.address) props.address = parsed.address
  if (parsed.city) props.city = parsed.city
  if (parsed.state) props.state = parsed.state
  if (parsed.zip) props.zip = parsed.zip

  const source = findAnswer(payload, Q.source)
  if (source) props.booking_source_self_reported = source

  return props
}

/**
 * The note body. Every Q&A goes in verbatim, including questions we don't map to a
 * property — the form is Abe-editable and a question added next month should still reach
 * the record without a code change.
 */
export function buildIntakeNote(payload, { eventTypeLabel, startTime, inviteeUri } = {}) {
  const lines = []
  lines.push('Calendly booking intake')
  if (eventTypeLabel) lines.push(`Event type: ${eventTypeLabel}`)
  if (startTime) lines.push(`Scheduled for: ${startTime}`)
  lines.push('')

  const rows = answerRows(payload)
  if (rows.length === 0) {
    lines.push('(no intake questions answered)')
  } else {
    for (const row of rows) {
      const q = String(row?.question || '').trim()
      const a = String(row?.answer || '').trim()
      if (!q) continue
      lines.push(`${q}: ${a || '(blank)'}`)
    }
  }

  const reminder = String(payload?.text_reminder_number || '').trim()
  if (reminder) {
    lines.push(`Text reminder number: ${reminder}`)
  }

  lines.push('')
  lines.push('— Attribution —')
  const source = findAnswer(payload, Q.source)
  lines.push(`Self-reported source: ${source || '(not answered)'}`)
  lines.push(trackingSummary(payload).line)

  lines.push('')
  lines.push('Auto-enriched from the Calendly webhook.')
  // Idempotency marker — see findNoteWithMarker(). Must stay on its own line and must
  // stay stable; changing the format re-notes every prior booking on redelivery.
  if (inviteeUri) lines.push(`[calendly-invitee: ${inviteeUri}]`)

  return lines.join('\n')
}

export function inviteeMarker(inviteeUri) {
  return inviteeUri ? `[calendly-invitee: ${inviteeUri}]` : null
}

export function consultDealName(fullName) {
  return `${String(fullName || '').trim()} - Full Service`
}
