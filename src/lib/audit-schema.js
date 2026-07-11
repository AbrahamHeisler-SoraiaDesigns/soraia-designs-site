import { z } from 'zod'

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA',
  'RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

const PRIMARY_GOAL_VALUES = [
  'increase_adr', 'increase_occupancy', 'force_equity',
  'position_for_exit', 'launch_well', 'not_sure',
]
const CURRENT_PERFORMANCE_VALUES = [
  'crushing_it', 'solid', 'stagnant', 'declining', 'not_listed_yet', 'dont_know',
]
const BUDGET_TIER_VALUES = [
  'under_5k', '5_to_15k', '15_to_30k', '30_to_60k', 'over_60k', 'exploring',
]
const TIMELINE_VALUES = [
  'within_30_days', 'within_60_days', 'within_90_days',
  'q3_q4_2026', '2027_or_later', 'not_sure',
]
export const IS_LISTED_OPTIONS = ['Yes', 'No', 'Coming soon']

// A2P-registered verbatim consent language (7/7-verified). COMPLIANCE-LOCKED —
// must match the registered opt-in exactly. Do NOT humanize, reword, or add an
// em dash. Rendered as the SMS-consent checkbox label on the audit form and
// stored verbatim on the contact for the consent audit trail.
export const SMS_CONSENT_LABEL =
  'I agree to receive text messages from Soraia Designs about my inquiry. Msg frequency varies, and msg & data rates may apply. Reply STOP to opt out or HELP for help.'

export const PRIMARY_GOAL_OPTIONS = [
  { value: 'increase_adr',       label: 'Raise nightly rate' },
  { value: 'increase_occupancy', label: 'Improve occupancy' },
  { value: 'force_equity',       label: 'Force equity for refinance' },
  { value: 'position_for_exit',  label: 'Position for sale / exit' },
  { value: 'launch_well',        label: 'Launch a new property well' },
  { value: 'not_sure',           label: "Not sure yet — that's why I'm here" },
]

export const CURRENT_PERFORMANCE_OPTIONS = [
  { value: 'crushing_it',     label: 'Top 10% of my submarket' },
  { value: 'solid',           label: 'Mid-pack, room to grow' },
  { value: 'stagnant',        label: 'Stagnant ADR or occupancy' },
  { value: 'declining',       label: 'Declining' },
  { value: 'not_listed_yet',  label: 'Not listed yet' },
  { value: 'dont_know',       label: "Don't know — haven't benchmarked" },
]

export const BUDGET_TIER_OPTIONS = [
  { value: 'under_5k',   label: 'Under $5k (light refresh)' },
  { value: '5_to_15k',   label: '$5k–$15k (room-by-room refresh)' },
  { value: '15_to_30k',  label: '$15k–$30k (one full property)' },
  { value: '30_to_60k',  label: '$30k–$60k (full property + premium)' },
  { value: 'over_60k',   label: '$60k+ (multi-property or full repositioning)' },
  { value: 'exploring',  label: 'Just exploring — depends what the audit shows' },
]

export const TIMELINE_OPTIONS = [
  { value: 'within_30_days',  label: 'Within 30 days' },
  { value: 'within_60_days',  label: 'Within 60 days' },
  { value: 'within_90_days',  label: 'Within 90 days' },
  { value: 'q3_q4_2026',      label: 'Q3 / Q4 2026' },
  { value: '2027_or_later',   label: '2027 or later' },
  { value: 'not_sure',        label: 'Not sure' },
]

const ROLE_BASED_EMAIL_RX = /^(info|admin|sales|hello|contact|support|noreply)@/i

const enumOrEmpty = (values) =>
  z.string().refine((v) => v === '' || values.includes(v), {
    message: `Must be one of: ${values.join(', ')}`,
  })

const enumStrict = (values) =>
  z.string().refine((v) => values.includes(v), {
    message: `Must be one of: ${values.join(', ')}`,
  })

// Required enum with a human-friendly message (used for the re-required Stage-2
// core qualifiers). A blank selection ('') fails with `message`, not the raw
// value list.
const enumRequired = (values, message) =>
  z.string({ required_error: message }).refine((v) => values.includes(v), { message })

// Personal-email gate, shared by capture + full schemas.
const personalEmail = z
  .string()
  .email('Please enter a valid email')
  .refine((v) => !ROLE_BASED_EMAIL_RX.test(v), {
    message: "Please use a personal email — role-based addresses won't reach you.",
  })

// Optional US/CA phone → E.164. Behavior-identical to the original inline rule.
const optionalPhone = z
  .string()
  .optional()
  .transform((v) => (v || '').replace(/\D/g, ''))
  .refine((digits) => digits === '' || digits.length === 10 || (digits.length === 11 && digits.startsWith('1')), {
    message: 'Enter a 10-digit US/CA phone number',
  })
  .transform((digits) => (digits === '' ? '' : '+1' + (digits.length === 11 ? digits.slice(1) : digits)))
  .refine((e164) => e164 === '' || /^\+1[2-9]\d{9}$/.test(e164), {
    message: 'Phone number area code must start with 2-9',
  })

const optionalTargetAdr = z
  .union([z.literal(''), z.literal(undefined), z.coerce.number().int().min(50).max(2000)])
  .optional()

// Property link. We recognize the common STR + real-estate hosts, but also
// accept any well-formed http(s) URL (MLS/other) so an unusual-but-valid link
// isn't hard-bounced — validate format, don't over-restrict host.
const isHttpUrl = (v) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(String(v || '').trim())
const LISTING_URL_MESSAGE =
  'Enter a valid property link — Airbnb, VRBO, Zillow, Realtor.com, Redfin, or any listing URL.'

// Required at the Stage-1 gate: every submission must carry a usable property link.
const requiredListingUrl = z
  .string()
  .trim()
  .min(1, 'A property link is required')
  .refine(isHttpUrl, { message: LISTING_URL_MESSAGE })

const optionalListingUrl = z
  .string()
  .optional()
  .refine((v) => !v || isHttpUrl(v), { message: LISTING_URL_MESSAGE })

export const auditFormSchema = z.object({
  full_name: z.string().min(2, 'Please enter your full name').max(80),
  email: personalEmail,
  phone: optionalPhone,
  property_street: z.string().min(5, 'Street address required'),
  property_city: z.string().min(2, 'City required'),
  property_state: enumStrict(US_STATES),
  property_zip: z.string().regex(/^\d{5}$/, '5-digit ZIP'),
  property_bedrooms: z.coerce.number().int().min(1).max(9),
  property_bathrooms: z.coerce.number().min(1).max(9),
  is_listed: enumStrict(IS_LISTED_OPTIONS),
  listing_url: optionalListingUrl,
  primary_goal: enumStrict(PRIMARY_GOAL_VALUES),
  target_adr: optionalTargetAdr,
  current_performance: enumOrEmpty(CURRENT_PERFORMANCE_VALUES).optional(),
  budget_tier: enumStrict(BUDGET_TIER_VALUES),
  timeline: enumStrict(TIMELINE_VALUES),
  notes: z.string().max(1000).optional(),
  _company_legal_name: z.string().max(0).optional(),
}).refine(
  (data) => data.is_listed !== 'Yes' || (!!data.listing_url && data.listing_url.length > 0),
  { message: 'Listing URL required when "Currently listed" is Yes', path: ['listing_url'] },
)

// ── Progressive two-stage form ──────────────────────────────────────────────
// Stage 1 is the conversion event: the minimum we need to own the lead. Six
// logical fields (name, email, the address block, bedrooms). On submit we
// create the HubSpot contact + fire the Lead pixel — the lead is ours even if
// they never finish Stage 2.
export const auditStage1Schema = z.object({
  full_name: z.string().min(2, 'Please enter your full name').max(80),
  email: personalEmail,
  property_street: z.string().min(5, 'Street address required'),
  property_city: z.string().min(2, 'City required'),
  property_state: enumStrict(US_STATES),
  property_zip: z.string().regex(/^\d{5}$/, '5-digit ZIP'),
  property_bedrooms: z.coerce.number().int().min(1).max(9),
  // A usable property link is the audit spine — required on every submission,
  // regardless of is_listed. is_listed only branches the audit type + helper copy.
  is_listed: enumStrict(IS_LISTED_OPTIONS),
  listing_url: requiredListingUrl,
  _company_legal_name: z.string().max(0).optional(),
})

// Stage 2 enriches the already-captured contact. Everything is optional — a
// bail here is a captured lead we follow up with, not a lost one. email +
// full_name are carried from Stage 1 to locate/label the contact and deal.
// is_listed + listing_url moved to the required Stage-1 gate, so they no
// longer live here.
export const auditEnrichmentSchema = z.object({
  // email + full_name are carried into the Stage-2 payload from the captured
  // Stage-1 contact — they are NOT inputs on the Stage-2 form. They must be
  // OPTIONAL here or client-side validation fails on an invisible required
  // field and the whole Stage-2 submit silently no-ops (regression since #11).
  // The server receives the real email in the payload to locate the contact.
  email: personalEmail.optional(),
  full_name: z.string().min(2).max(80).optional(),
  phone: optionalPhone,
  // Optional SMS opt-in. Unchecked by default. The label shown to the user is
  // the A2P-registered verbatim consent language (see SMS_CONSENT_LABEL). Only
  // meaningful when a phone number is also provided; the backend records the
  // consent + timestamp + verbatim text for the compliance audit trail.
  sms_consent: z.boolean().optional(),
  property_bathrooms: z
    .union([z.literal(''), z.literal(undefined), z.coerce.number().min(1).max(9)])
    .optional(),
  // Core qualifiers — RE-REQUIRED on Stage 2 (2026-07-10). Every audit since
  // 6/20 built blind on inferred goal/budget/timeline because #11 made these
  // optional; re-requiring restores qualification for the setter + nurture.
  // A Stage-2 *skip* never hits this schema (client navigates away without a
  // submit), so requiring here only gates an actual "Send These Details" click.
  primary_goal: enumRequired(PRIMARY_GOAL_VALUES, 'Pick the goal that fits best — it shapes the whole audit.'),
  budget_tier: enumRequired(BUDGET_TIER_VALUES, 'A rough budget band changes what we recommend.'),
  timeline: enumRequired(TIMELINE_VALUES, 'Let us know your timeline so we prioritize the right moves.'),
  // Genuinely optional enrichment.
  target_adr: optionalTargetAdr,
  current_performance: enumOrEmpty(CURRENT_PERFORMANCE_VALUES).optional(),
  notes: z.string().max(1000).optional(),
  // Phone-capture A/B (2026-07-10): which variant the user saw. Optional +
  // free-form so a missing/unknown value never 400s a Stage-2 submit.
  phone_capture_variant: z.string().max(20).optional(),
  _company_legal_name: z.string().max(0).optional(),
})
