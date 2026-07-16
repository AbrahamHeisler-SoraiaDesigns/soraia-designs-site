export const HUBSPOT_PORTAL_ID = '245704749'
export const HUBSPOT_OWNER_ID = '163942674'
// List 3 = "STR Audit Leads" (the real list). Prod overrides via BREVO_AUDIT_LIST_ID.
// Was 8 — a list that doesn't exist on the account (lists 2/3/4 only). (Maya, 2026-07-16)
export const DEFAULT_BREVO_LIST_ID = 3
export const DEFAULT_BREVO_PIPELINE_ID = '69ff8080a984860c6a8d003f'
export const DEFAULT_BREVO_STAGE_NEW_ID = '4bd48361-2ce7-4bf0-aedb-fc48a902ba53'
export const DEFAULT_FROM_EMAIL = 'audit@soraiadesigns.com'
export const DEFAULT_FROM_NAME = 'Soraia Designs'
export const DEFAULT_REPLY_TO = 'hello@soraiadesigns.com'
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
