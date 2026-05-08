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

export const auditFormSchema = z.object({
  full_name: z.string().min(2, 'Please enter your full name').max(80),
  email: z
    .string()
    .email('Please enter a valid email')
    .refine((v) => !ROLE_BASED_EMAIL_RX.test(v), {
      message: "Please use a personal email — role-based addresses won't reach you.",
    }),
  phone: z
    .string()
    .transform((v) => (v || '').replace(/\D/g, ''))
    .refine((digits) => digits.length === 10 || (digits.length === 11 && digits.startsWith('1')), {
      message: 'Enter a 10-digit US/CA phone number',
    })
    .transform((digits) => '+1' + (digits.length === 11 ? digits.slice(1) : digits))
    .refine((e164) => /^\+1[2-9]\d{9}$/.test(e164), {
      message: 'Phone number area code must start with 2-9',
    }),
  property_street: z.string().min(5, 'Street address required'),
  property_city: z.string().min(2, 'City required'),
  property_state: enumStrict(US_STATES),
  property_zip: z.string().regex(/^\d{5}$/, '5-digit ZIP'),
  property_bedrooms: z.coerce.number().int().min(1).max(9),
  property_bathrooms: z.coerce.number().min(1).max(9),
  is_listed: enumStrict(IS_LISTED_OPTIONS),
  listing_url: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^https:\/\/(www\.)?(airbnb|vrbo|booking)\./.test(v),
      { message: 'Must be an Airbnb, VRBO, or Booking.com URL' },
    ),
  primary_goal: enumStrict(PRIMARY_GOAL_VALUES),
  target_adr: z
    .union([z.literal(''), z.literal(undefined), z.coerce.number().int().min(50).max(2000)])
    .optional(),
  current_performance: enumOrEmpty(CURRENT_PERFORMANCE_VALUES).optional(),
  budget_tier: enumStrict(BUDGET_TIER_VALUES),
  timeline: enumStrict(TIMELINE_VALUES),
  notes: z.string().max(1000).optional(),
  _company_legal_name: z.string().max(0).optional(),
}).refine(
  (data) => data.is_listed !== 'Yes' || (!!data.listing_url && data.listing_url.length > 0),
  { message: 'Listing URL required when "Currently listed" is Yes', path: ['listing_url'] },
)
