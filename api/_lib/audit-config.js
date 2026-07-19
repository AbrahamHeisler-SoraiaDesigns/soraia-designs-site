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
