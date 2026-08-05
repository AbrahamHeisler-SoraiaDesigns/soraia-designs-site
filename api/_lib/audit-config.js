export const HUBSPOT_PORTAL_ID = '245704749'
export const HUBSPOT_OWNER_ID = '163942674'
// List 3 = "STR Audit Leads" (the real list). Prod overrides via BREVO_AUDIT_LIST_ID.
// Was 8 — a list that doesn't exist on the account (lists 2/3/4 only). (Maya, 2026-07-16)
export const DEFAULT_BREVO_LIST_ID = 3
export const DEFAULT_BREVO_PIPELINE_ID = '69ff8080a984860c6a8d003f'
export const DEFAULT_BREVO_STAGE_NEW_ID = '4bd48361-2ce7-4bf0-aedb-fc48a902ba53'
// Audit-funnel email consolidates to abe@soraiadesigns.com (Gmail) per the ratified
// 7/15 decision — Brevo/Resend demoted to verified fallback only. From-identity must
// match the Gmail sequencer (gmail.js: "Abe Heisler <abe@>") so the sender never flips
// mid-ladder between the delivery email (email_2) and nurture (email_3+). Reply-To is
// abe@ so even a fallback send lands replies in Abe's inbox. Prod may still override
// these via BREVO_SENDER_EMAIL/NAME + BREVO_REPLY_TO env (senderProfile()).
export const DEFAULT_FROM_EMAIL = 'abe@soraiadesigns.com'
export const DEFAULT_FROM_NAME = 'Abe Heisler'
export const DEFAULT_REPLY_TO = 'abe@soraiadesigns.com'
export const DEFAULT_CALENDLY_URL = 'https://calendly.com/soraiadesigns/str-design-audit-review'
export const DEFAULT_PIXEL_ID = '966166489104332'

export const HUBSPOT_CONTACT_BASE_PROPS = [
  'email',
  'firstname',
  'lastname',
  'phone',
  'audit_property_street',
  'audit_property_city',
  'audit_property_state',
  'audit_property_zip',
  'audit_property_bedrooms',
  'audit_property_bathrooms',
  'audit_is_listed',
  'audit_listing_url',
  'audit_primary_goal',
  'audit_target_adr',
  'audit_current_performance',
  'audit_budget_tier',
  'audit_timeline',
  'audit_notes',
  'audit_status',
  'audit_pdf_url',
  'audit_test',
  'audit_phone_capture_variant',
  'audit_phone_present',
  'audit_sms_consent',
  'audit_sms_consent_at',
  'audit_sms_consent_text',
  'audit_sms_consent_source',
  'audit_nurture_status',
  'audit_last_email_key',
  'audit_last_email_sent_at',
  'audit_reengage_after',
  'audit_brevo_sync_status',
  'audit_brevo_last_sync_at',
  'audit_referrer',
  'audit_landing_page',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'hs_lead_status',
]

export const HUBSPOT_SEARCH_PROPS = [
  ...HUBSPOT_CONTACT_BASE_PROPS,
  'lifecyclestage',
  'hubspot_owner_id',
  'createdate',
  'lastmodifieddate',
]

export const EMAIL_KEYS = {
  EMAIL_1: 'email_1_confirmation',
  EMAIL_2: 'email_2_audit_ready',
  EMAIL_3: 'email_3_one_question',
  EMAIL_4: 'email_4_math',
  EMAIL_5: 'email_5_last_note',
  // Drop-off recovery layer (SOR-127 §4): audit delivered, no booking, core cadence done.
  RECOVERY_1: 'recovery_1_one_more_thing',
  RECOVERY_2: 'recovery_2_closing_file',
  // Dated re-engagement (2026-08-05). NOT part of the ladder — a one-shot rung that
  // only ever fires for a lead a human explicitly parked via audit_reengage_after.
  REENGAGE_1: 'reengage_1_timing_check',
}

// Deal-stage suppression (Abe's ask 2026-07-17): the sequencer reads contact
// props only, so moving a deal off "New Lead" in the Sales Pipeline was invisible
// to it. New Lead is the ONLY stage that keeps a contact mailable — any other
// stage (Appointment Scheduled, Not a Fit, Long Term FU, Closed Won/Lost, …) means
// a human engaged the lead → stop the sequence. New Lead lives only in the default
// Sales Pipeline, so a plain "stage !== this id" check also catches deals in other
// pipelines (e.g. a Full Service deal) without needing to enumerate every pipeline.
export const NEW_LEAD_DEAL_STAGE_ID = '3427549892'

// Pure decision for the deal-stage gate (kept here — audit-config has no
// side-effecting imports — so it's unit-testable in isolation). A deal counts as
// "engaged" (a human moved it forward) only if it has a real stage that is NOT one
// of the non-engaging stages. `nonEngagingStageIds` is the New Lead id PLUS the
// stage fresh "- Audit" deals are actually created in (HUBSPOT_AUDIT_DEAL_STAGE_ID),
// so a brand-new deal is never mistaken for engagement even if that env var ever
// drifts from the hardcoded New Lead id. A falsy dealstage is treated as NOT
// engaged on purpose: every real HubSpot deal has a stage, so an empty one is a
// read anomaly (partial batch response), not evidence of engagement — the API-error
// path in the caller already fails closed for genuine read failures.
export function findEngagedDeal(deals, nonEngagingStageIds) {
  const nonEngaging = new Set((nonEngagingStageIds || []).filter(Boolean))
  return (deals || []).find((d) => d && d.dealstage && !nonEngaging.has(d.dealstage)) || null
}

export const ACTIVE_NURTURE_STATUSES = new Set(['active', 'not_enrolled'])
export const TERMINAL_LEAD_STATUSES = new Set(['CALL_BOOKED', 'CALL_COMPLETED', 'OPEN_DEAL'])
export const TERMINAL_NURTURE_STATUSES = new Set([
  'paused_reply',
  'paused_booked',
  'completed',
  'unqualified',
  'unsubscribed',
  'bounced',
  'complained',
  'paused_manual',
])

// The pauses a HUMAN chose, as opposed to the ones the lead chose. Every status in
// here means "stop the ladder, a person has this" — none of them mean "never contact
// this lead again". These are the only states a dated re-engagement is allowed to
// release. The complement (unsubscribed / bounced / complained / unqualified) is a
// hard opt-out and is deliberately absent: no date, set by anyone, releases those.
export const SOFT_PAUSE_NURTURE_STATUSES = new Set([
  'paused_reply',
  'paused_booked',
  'paused_manual',
  'completed',
])

// Dated re-engagement (`audit_reengage_after`) — a human parks a warm-but-not-now
// lead on a date instead of a manual CRM task nobody opens.
//
// Two halves, and they are NOT symmetric:
//
//   HOLD (date in the future) — suppresses sends for ANY lead, including an active
//   one mid-ladder. This is the "circle back in a month" park. It costs nothing and
//   burns no terminal status, so the lead resumes cleanly when the date lands.
//
//   RELEASE (date reached) — an active lead simply resumes the normal ladder: the
//   hold expired, nothing else changed. A soft-paused lead is different — resuming
//   the ladder would drop them into email_3 ("one question on your audit"), which is
//   audit-followup copy aimed at someone who just received a PDF, not at someone
//   who told us to come back in six weeks. So a soft-paused release routes to the
//   one-shot REENGAGE_1 rung instead, and never re-arms emails 3-5.
//
// Both halves fail SAFE on a malformed date: toMs() returns 0, which reads as "no
// date set", which leaves every existing gate exactly as it was.
export function reengageHoldActive(contact, nowMs = Date.now()) {
  const at = Date.parse(contact?.audit_reengage_after || '')
  if (!Number.isFinite(at)) return false
  return at > nowMs
}

export function reengageIsDue(contact, nowMs = Date.now()) {
  const at = Date.parse(contact?.audit_reengage_after || '')
  if (!Number.isFinite(at)) return false
  return at <= nowMs
}

// Hard opt-outs — the ONLY states that block delivering the audit itself.
//
// The audit is a deliverable the lead explicitly requested, not a marketing touch.
// `paused_reply`, `paused_booked`, `paused_manual`, `completed` and an engaged deal
// all mean "a human is handling this lead" — which is a reason to stop the FOLLOW-UP
// ladder (emails 3-5), never a reason to withhold the thing they asked for. Only a
// genuine opt-out, an undeliverable address, or an explicit disqualification blocks
// a delivery.
//
// `unqualified` is in this set on Maya's review of PR #36 (2026-08-04): suppression
// and disqualification sit ABOVE every gate and must block email_2 too. Ed Roberts
// (ed@knerealty.com, marked Not-a-Fit 7/17, audit_nurture_status='unqualified') must
// never receive a delivery. Without this the delivery-gate exemption would have
// re-opened a path to exactly the leads a human already ruled out.
export const DELIVERY_BLOCKING_NURTURE_STATUSES = new Set([
  'unsubscribed',
  'bounced',
  'complained',
  'unqualified',
])

// The same rule expressed on the sales-pipeline field. A lead disqualified or opted
// out on hs_lead_status is blocked regardless of what audit_nurture_status says —
// the two are written by different systems and either one saying "stop" means stop.
// Deliberately EXCLUDES CALL_BOOKED / CALL_COMPLETED / OPEN_DEAL: those stop the
// nurture ladder but a lead deep in conversation still gets the artifact they asked
// for (Maya: "Somerled-stage leads still get the audit").
export const DELIVERY_BLOCKING_LEAD_STATUSES = new Set([
  'UNQUALIFIED',
  'UNSUBSCRIBED',
  'BOUNCED',
  'SPAM_COMPLAINT',
])

export const CALENDLY_WEBHOOK_EVENT_TYPES = new Set(['invitee.created', 'invitee.canceled'])

export const BREVO_TAGS = {
  AUDIT_LEAD: 'audit-lead',
  NURTURE_ACTIVE: 'nurture-active',
  AUDIT_REQUESTED: 'audit-requested',
  AUDIT_DELIVERED: 'audit-delivered',
  NURTURE_COMPLETE: 'nurture-complete',
  CONSULT_BOOKED: 'consult-booked',
  REPLIED: 'replied',
  UNQUALIFIED: 'unqualified',
  PRELAUNCH: 'prelaunch',
  ACTIVE_UNDERPERFORMING: 'active-underperforming',
  REPOSITIONING: 'repositioning',
  FIRST_TIME_INVESTOR: 'first-time-investor',
  SINGLE_PROPERTY: 'single-property',
  PORTFOLIO_OWNER: 'portfolio-owner',
  HIGH_INTENT: 'high-intent',
  ENGAGED: 'engaged',
  PASSIVE: 'passive',
  COLD: 'cold',
}
