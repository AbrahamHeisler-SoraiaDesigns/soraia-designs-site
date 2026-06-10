import crypto from 'node:crypto'
import {
  BREVO_TAGS,
  DEFAULT_CALENDLY_URL,
  DEFAULT_FROM_EMAIL,
  DEFAULT_FROM_NAME,
  DEFAULT_REPLY_TO,
  EMAIL_KEYS,
} from './audit-config.js'

export function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s || '').trim().toLowerCase()).digest('hex')
}

export function makeEventId(email, address) {
  const minute = Math.floor(Date.now() / 60_000)
  return crypto.createHash('sha256').update(`${email}|${address}|${minute}`).digest('hex')
}

export function splitName(full) {
  const trimmed = String(full || '').trim()
  const i = trimmed.indexOf(' ')
  if (i < 0) return { firstname: trimmed, lastname: '' }
  return { firstname: trimmed.slice(0, i), lastname: trimmed.slice(i + 1).trim() }
}

export function isoNow() {
  return new Date().toISOString()
}

export function toMs(value) {
  if (!value) return 0
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : 0
}

export function daysSince(value) {
  const ms = toMs(value)
  if (!ms) return Infinity
  return (Date.now() - ms) / 86_400_000
}

export function formatPropertyLine(contact) {
  const street = contact.audit_property_street || contact.property_street || ''
  const city = contact.audit_property_city || contact.property_city || ''
  const state = contact.audit_property_state || contact.property_state || ''
  return [street, [city, state].filter(Boolean).join(', ')].filter(Boolean).join(', ')
}

export function firstName(contact) {
  return contact.firstname || splitName(contact.full_name || '').firstname || 'there'
}

export function buildAuditDealName(contact) {
  const fullName = contact.full_name || [contact.firstname, contact.lastname].filter(Boolean).join(' ') || contact.email || 'Audit Lead'
  const location = [contact.property_city || contact.audit_property_city, contact.property_state || contact.audit_property_state].filter(Boolean).join(', ')
  return `${fullName}${location ? ` — ${location}` : ''} Audit`
}

export function calendlyUrl(emailKey) {
  const url = process.env.CALENDLY_AUDIT_URL || DEFAULT_CALENDLY_URL
  const join = url.includes('?') ? '&' : '?'
  return `${url}${join}utm_source=audit_nurture&utm_medium=email&utm_campaign=v1&utm_content=${emailKey}`
}

export function senderProfile() {
  return {
    email: process.env.BREVO_SENDER_EMAIL || DEFAULT_FROM_EMAIL,
    name: process.env.BREVO_SENDER_NAME || DEFAULT_FROM_NAME,
    replyTo: process.env.BREVO_REPLY_TO || DEFAULT_REPLY_TO,
  }
}

function publicSiteUrl() {
  return (process.env.SITE_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.soraiadesigns.com').replace(/\/$/, '')
}

function unsubscribeSecret() {
  return process.env.NURTURE_UNSUBSCRIBE_SECRET || process.env.BREVO_WEBHOOK_SECRET || process.env.HUBSPOT_SERVICE_KEY || 'local-dev-secret'
}

export function unsubscribeSignature(email) {
  return crypto.createHmac('sha256', unsubscribeSecret()).update(String(email || '').trim().toLowerCase()).digest('hex')
}

export function unsubscribeUrl(email) {
  const params = new URLSearchParams({
    email: String(email || '').trim().toLowerCase(),
    sig: unsubscribeSignature(email),
  })
  return `${publicSiteUrl()}/api/audit-nurture-event?${params.toString()}`
}

function nurtureFooter(contact) {
  const sender = senderProfile()
  const unsubUrl = unsubscribeUrl(contact.email)
  return `
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5;" />
    <p style="font-size:12px;line-height:1.5;color:#666;">
      Reply to this email if you'd rather talk it through directly.<br/>
      If these audit follow-ups are not useful, <a href="${unsubUrl}">unsubscribe here</a>.<br/>
      Reply-to: ${sender.replyTo}
    </p>
  `
}

export function buildBrevoTags(contact) {
  const tags = new Set([BREVO_TAGS.AUDIT_LEAD])

  const isListed = contact.audit_is_listed || contact.is_listed
  const timeline = contact.audit_timeline || contact.timeline
  const budget = contact.audit_budget_tier || contact.budget_tier
  const leadStatus = contact.hs_lead_status || ''
  const nurtureStatus = contact.audit_nurture_status || ''
  const auditStatus = contact.audit_status || ''
  const primaryGoal = contact.audit_primary_goal || contact.primary_goal

  if (auditStatus === 'requested') tags.add(BREVO_TAGS.AUDIT_REQUESTED)
  if (auditStatus === 'delivered') tags.add(BREVO_TAGS.AUDIT_DELIVERED)
  if (nurtureStatus === 'active' || nurtureStatus === 'not_enrolled') tags.add(BREVO_TAGS.NURTURE_ACTIVE)
  if (nurtureStatus === 'completed') tags.add(BREVO_TAGS.NURTURE_COMPLETE)
  if (nurtureStatus === 'paused_booked' || leadStatus === 'CALL_BOOKED') tags.add(BREVO_TAGS.CONSULT_BOOKED)
  if (nurtureStatus === 'paused_reply') tags.add(BREVO_TAGS.REPLIED)
  if (nurtureStatus === 'unqualified' || leadStatus === 'UNQUALIFIED') tags.add(BREVO_TAGS.UNQUALIFIED)

  if (isListed === 'Coming soon') tags.add(BREVO_TAGS.PRELAUNCH)
  if (isListed === 'Yes') tags.add(BREVO_TAGS.ACTIVE_UNDERPERFORMING)
  if (primaryGoal === 'force_equity' || primaryGoal === 'position_for_exit') tags.add(BREVO_TAGS.REPOSITIONING)

  if (budget === 'exploring' || budget === 'under_5k') {
    tags.add(BREVO_TAGS.FIRST_TIME_INVESTOR)
  } else if (budget === '30_to_60k' || budget === 'over_60k') {
    tags.add(BREVO_TAGS.PORTFOLIO_OWNER)
  } else {
    tags.add(BREVO_TAGS.SINGLE_PROPERTY)
  }

  if (timeline === 'within_30_days' || timeline === 'within_60_days') tags.add(BREVO_TAGS.HIGH_INTENT)

  return Array.from(tags).sort()
}

function htmlParagraphs(lines) {
  return lines.map((line) => `<p>${line}</p>`).join('')
}

function bullets(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
}

// Drop-off recovery angle, keyed to the lead's audit_primary_goal (real HubSpot enum values).
// The one piece that needs a live conversation rather than a PDF.
function dropoffAngle(contact) {
  const goal = contact.audit_primary_goal || contact.primary_goal || ''
  const map = {
    increase_occupancy: 'How to position the listing so the platform starts treating it as a top-tier comp instead of a substitutable one. That shift compounds, and the audit cannot model it without your live booking data.',
    increase_adr: 'Which specific design moves let you hold a higher nightly rate without losing occupancy, and the order to sequence them so rate and bookings move together instead of against each other.',
    force_equity: 'Which design moves the appraisal actually credits, versus the ones guests love but appraisers ignore, and the budget order that protects your refinance math.',
    position_for_exit: 'How a buyer will value this property at sale, and the design arc that moves it from an Airbnb to a stabilized asset with an income story. Different sequencing, different return on each dollar.',
    launch_well: 'How to launch so the first 90 days build review velocity and ranking instead of leaking it. That early window sets the property ceiling for years.',
  }
  return map[goal] || 'Which of the priority fixes to do first. That order depends on your specific situation and goals, not the audit general logic.'
}

export function buildEmailContent(emailKey, contact) {
  const name = firstName(contact)
  const propertyLine = formatPropertyLine(contact)
  const propertyStreet = contact.audit_property_street || ''
  const auditPdfUrl = contact.audit_pdf_url || ''
  const callUrl = calendlyUrl(emailKey)
  const footer = nurtureFooter(contact)

  switch (emailKey) {
    case EMAIL_KEYS.EMAIL_1:
      return {
        subject: "We've got your audit request. Here's what's next",
        previewText: `Audit on ${propertyLine || propertyStreet} is in motion. Here's the timeline.`,
        html: htmlParagraphs([
          `Hi ${name},`,
          `Thanks for the audit request on <strong>${propertyLine}</strong>.`,
          `Here's how this works:`,
        ]) + bullets([
          '<strong>A senior strategist starts on your property today.</strong> Not an automated report. Actual eyes on your listing, your comps, and your design. Soraia Heisler reviews every audit personally before it ships.',
          `<strong>Expect your written audit inside 5 business days.</strong> It'll cover ADR + RevPAR benchmarking, listing visibility, design-to-revenue gaps, forced-equity opportunities, and a prioritized roadmap.`,
          '<strong>The audit is yours.</strong> Whether or not we ever work together, you walk away with the report.',
        ]) + htmlParagraphs([
          `If you'd like to walk through the audit together when it's ready, you can lock in that conversation now and skip the scheduling back-and-forth: <a href="${callUrl}">Book your audit review call</a>.`,
          "If you'd rather wait for the report and decide after, that's fine too. No pressure either way.",
          'Talk soon,',
          'Abe Heisler<br/>Soraia Designs',
        ]) + footer,
      }
    case EMAIL_KEYS.EMAIL_2:
      return {
        subject: `Your audit on ${propertyStreet}, yours to keep`,
        previewText: 'PDF attached. Senior strategist notes inside.',
        html: htmlParagraphs([
          `Hi ${name},`,
          `Your STR audit for <strong>${propertyLine}</strong> is ready.`,
          `<a href="${auditPdfUrl}"><strong>Download your audit (PDF) →</strong></a>`,
          'Quick summary of what\'s inside:',
        ]) + bullets([
          'ADR + RevPAR benchmark vs. your submarket\'s top quartile',
          'Listing visibility audit: first 4 photos, title, signal-to-noise',
          'Design-to-revenue gaps ranked by ROI',
          'Forced-equity opportunities and capital-allocation roadmap',
          'Exit-positioning notes for if/when you sell',
        ]) + htmlParagraphs([
          "No pitch in the audit. It's a real report. Read it on your own first if you want.",
          `If the numbers are useful and you want to walk through how we'd actually execute on the roadmap, <a href="${callUrl}">book your audit review / next steps call</a>.`,
          'No call needed if the audit answered everything. We\'re good either way.',
          'Abe Heisler<br/>Soraia Designs',
        ]) + footer,
      }
    case EMAIL_KEYS.EMAIL_3:
      return {
        subject: 'One question on your audit',
        previewText: "What stood out, and what didn't.",
        html: htmlParagraphs([
          `Hi ${name},`,
          `Quick check-in on the audit we sent for <strong>${propertyStreet}</strong>.`,
          '<strong>One question: what stood out, and what didn\'t?</strong>',
          'Every property has one or two opportunities that materially move the needle, and four or five that look interesting but do not change the math.',
          `You can just hit reply, or <a href="${callUrl}">book the audit review call</a> and we'll walk through the roadmap together.`,
          'Abe',
        ]) + footer,
      }
    case EMAIL_KEYS.EMAIL_4:
      return {
        subject: 'How we sanity-check design spend',
        previewText: 'The conservative math behind whether a redesign is worth it.',
        html: htmlParagraphs([
          `Hi ${name},`,
          'A few people who\'ve gotten our audit have asked the same question:',
          '<strong>How do you actually know whether spending $20k–$45k on a redesign pays back?</strong>',
          'Here is the conservative model we use before recommending anything:',
        ]) + bullets([
          'Start with current ADR, occupancy, and estimated annual nights sold',
          'Model only the design moves that could plausibly affect rate or conversion',
          'Run a conservative lift case first - not the best-case scenario',
          'Compare projected incremental NOI against project cost and payback period',
          'If the math is thin, the recommendation should get lighter - or not happen at all',
        ]) + htmlParagraphs([
          'We do use example ranges internally, but the real point is discipline: the property has to justify the spend, not the other way around.',
          `If you want to plug your real numbers in together, <a href="${callUrl}">book the call</a>.`,
          'Abe',
        ]) + footer,
      }
    case EMAIL_KEYS.EMAIL_5:
      return {
        subject: 'Last note from us on this',
        previewText: "Door's open if the timing changes.",
        html: htmlParagraphs([
          `Hi ${name},`,
          `This is the last email from me on the audit for <strong>${propertyStreet}</strong>.`,
          '<strong>If the property has a real design-to-revenue gap, is fixing it something you want to solve this quarter?</strong>',
          `If the answer is yes and the timing's right, <a href="${callUrl}">book the audit review call</a>.`,
          "If the timing isn't right, totally fair. Hold onto the audit and come back when you're ready.",
          'Either way, glad we got to look at the property.',
          'Abe Heisler<br/>Soraia Designs',
        ]) + footer,
      }
    case EMAIL_KEYS.RECOVERY_1:
      return {
        subject: "One thing we didn't get to in your audit",
        previewText: 'The part that needs a live conversation.',
        html: htmlParagraphs([
          `Hi ${name},`,
          `The audit covered what <strong>${propertyStreet}</strong> is doing now and the highest-leverage moves. There is one piece that does not fit cleanly into a PDF:`,
          dropoffAngle(contact),
          'If that is a real question for you, a short strategy call is where we map it against your actual numbers.',
          `<a href="${callUrl}">Book your audit review call</a>`,
          'Abe Heisler<br/>Soraia Designs',
        ]) + footer,
      }
    case EMAIL_KEYS.RECOVERY_2:
      return {
        subject: 'Last note before we close your audit file',
        previewText: 'Honest update on our end.',
        html: htmlParagraphs([
          `Hi ${name},`,
          'We rotate our audit pipeline every quarter, and your file moves to the archive next week. Nothing dramatic, just internal housekeeping.',
          `If the timing has shifted and you want to talk before then, here is the link: <a href="${callUrl}">book your audit review call</a>.`,
          `Otherwise, I hope the audit notes still earn their keep on <strong>${propertyStreet}</strong>.`,
          'Abe Heisler<br/>Soraia Designs',
        ]) + footer,
      }
    default:
      throw new Error(`Unknown email key: ${emailKey}`)
  }
}
