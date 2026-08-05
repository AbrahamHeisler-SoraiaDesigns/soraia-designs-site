// The intake questionnaire, as data. Single source of truth for three consumers:
// the submit endpoint's validation, the design-brief Doc renderer, and the master
// Sheet's column order — plus the form UI in phase 4. Adding a question here is
// meant to be the *only* edit required.
//
// `notion` holds the exact property name on the old Notion form
// (collection://e90c15c2-f3a5-46f7-a667-2a33a6029b90). Keeping it lets a historical
// submission be replayed into the same columns after cutover, and makes it obvious
// which fields are ports versus new. Do not "tidy" those strings — the curly
// apostrophe in "Absolute No’s" and the en dash in "Competitor Listings (2–3)" are
// what is actually stored over there.

export const SECTIONS = [
  { id: 'property', title: 'The Property', blurb: 'The basics we build everything else on.' },
  { id: 'goals', title: 'Goals & Guests', blurb: 'Who you are designing for, and what winning looks like.' },
  { id: 'budget', title: 'Budget & Scope', blurb: 'What we have to work with.' },
  { id: 'renovation', title: 'Renovation', blurb: 'Skip anything that does not apply to your project.' },
  { id: 'style', title: 'Style & Inspiration', blurb: 'The part that becomes your mood board.' },
]

// Order within a section is the order the client sees, and the order the brief and
// the Sheet use. Sections are ordered as above.
export const QUESTIONS = [
  // ---- The Property -------------------------------------------------------
  {
    id: 'full_name',
    notion: 'Full Name',
    label: 'Full name',
    type: 'text',
    section: 'property',
    required: true,
  },
  {
    id: 'property_address',
    notion: 'Property Address',
    label: 'Property address',
    type: 'text',
    section: 'property',
    required: true,
  },
  { id: 'square_footage', notion: 'Square Footage', label: 'Square footage', type: 'number', section: 'property' },
  { id: 'bedrooms', notion: 'Bedrooms', label: 'Bedrooms', type: 'number', section: 'property' },
  { id: 'bathrooms', notion: 'Bathrooms', label: 'Bathrooms', type: 'number', section: 'property' },
  {
    id: 'guest_count_goal',
    notion: 'Guest Count Goal',
    label: 'Guest count goal',
    type: 'number',
    section: 'property',
    help: 'How many guests you want the property to sleep comfortably.',
  },
  {
    id: 'property_photos',
    notion: 'Property Photos',
    label: 'Photos of the property as it is today',
    type: 'files',
    uploadKind: 'property_photos',
    section: 'property',
    help: 'Wide shots of each room beat close-ups. Phone photos are fine.',
  },
  {
    // New — the old form had no floor-plan question, so plans arrived mixed into
    // one undifferentiated "Client Uploads" folder. Asking separately is the point
    // of the rebuild; UPLOAD_ROUTES already knows where these go.
    id: 'floor_plans',
    notion: null,
    label: 'Floor plans or measurements',
    type: 'files',
    uploadKind: 'floor_plans',
    section: 'property',
    help: 'PDF, image, or CAD export. If you do not have plans, leave this blank.',
  },
  { id: 'matterport_link', notion: 'Matterport Link', label: 'Matterport link', type: 'url', section: 'property' },
  {
    id: 'listing_link',
    notion: 'Airbnb / Listing Link',
    label: 'Airbnb / listing link',
    type: 'url',
    section: 'property',
    help: 'If the property is already listed anywhere.',
  },

  // ---- Goals & Guests -----------------------------------------------------
  {
    id: 'target_audience',
    notion: 'Ideal Target Audience',
    label: 'Ideal guest',
    type: 'longtext',
    section: 'goals',
    help: 'Families, couples, remote workers, groups celebrating something.',
  },
  {
    id: 'adr_goal',
    notion: 'Target Nightly Rate / ADR Goal',
    label: 'Target nightly rate',
    type: 'text',
    section: 'goals',
  },
  {
    id: 'competitor_listings',
    notion: 'Competitor Listings (2–3)',
    label: 'Two or three listings you are competing with',
    type: 'longtext',
    section: 'goals',
    help: 'Links are ideal. These tell us what your guest is comparing you against.',
  },
  {
    id: 'review_goal',
    notion: 'Review Goal (What Guests Say)',
    label: 'What you want guests to say in reviews',
    type: 'longtext',
    section: 'goals',
  },
  {
    id: 'photo_moments',
    notion: 'Photo Moments (Shareable Spaces)',
    label: 'Spaces you want to be photo moments',
    type: 'longtext',
    section: 'goals',
  },

  // ---- Budget & Scope -----------------------------------------------------
  {
    id: 'total_furnishings_budget',
    notion: 'Total Furnishings Budget',
    label: 'Total furnishings budget',
    type: 'text',
    section: 'budget',
    required: true,
    help: 'A range is fine. This is the single number that shapes every recommendation we make.',
  },
  {
    id: 'budget_flexibility',
    notion: 'Budget Flexibility',
    label: 'How flexible is that number?',
    type: 'text',
    section: 'budget',
  },
  {
    id: 'durability_level',
    notion: 'Preferred Durability Level',
    label: 'Preferred durability level',
    type: 'select',
    section: 'budget',
    options: ['Budget-friendly', 'Mid-range', 'High-durability commercial grade'],
  },
  {
    id: 'items_to_keep',
    notion: 'Existing Items To Keep',
    label: 'Anything existing we should design around',
    type: 'longtext',
    section: 'budget',
  },
  {
    id: 'guest_ready_basics',
    notion: 'Need Guest-Ready Basics List?',
    label: 'Do you want a guest-ready basics list?',
    type: 'select',
    section: 'budget',
    options: ['Yes', 'No'],
    help: 'Linens, kitchenware, and the small things that get forgotten before launch.',
  },

  // ---- Renovation ---------------------------------------------------------
  {
    id: 'planning_renovation',
    notion: 'Planning Construction / Renovation?',
    label: 'Planning any construction or renovation?',
    type: 'select',
    section: 'renovation',
    options: ['Yes', 'No', 'Unsure'],
  },
  {
    id: 'renovation_level',
    notion: 'Renovation Level',
    label: 'Renovation level',
    type: 'select',
    section: 'renovation',
    options: ['Full renovation', 'Light cosmetic updates', 'Design only'],
  },
  {
    id: 'interior_areas',
    notion: 'Interior Areas To Renovate',
    label: 'Interior areas to renovate',
    type: 'longtext',
    section: 'renovation',
  },
  {
    id: 'exterior_areas',
    notion: 'Exterior Areas To Renovate',
    label: 'Exterior areas to renovate',
    type: 'longtext',
    section: 'renovation',
  },
  {
    id: 'renovation_budget_by_area',
    notion: 'Renovation Budget By Area',
    label: 'Renovation budget by area',
    type: 'longtext',
    section: 'renovation',
  },
  {
    id: 'renovation_timeline',
    notion: 'Renovation Timeline',
    label: 'Is your timeline locked or flexible?',
    type: 'select',
    section: 'renovation',
    options: ['Locked', 'Flexible'],
  },
  {
    id: 'contractor_referrals',
    notion: 'Need Contractor Referrals?',
    label: 'Want contractor referrals?',
    type: 'select',
    section: 'renovation',
    options: ['Yes', 'No'],
  },
  {
    id: 'exterior_design',
    notion: 'Need Exterior Design / Amenities?',
    label: 'Need exterior design or amenities?',
    type: 'select',
    section: 'renovation',
    options: ['Yes', 'No', 'Partial'],
  },
  {
    id: 'exterior_spaces',
    notion: 'Exterior Spaces To Include',
    label: 'Exterior spaces to include',
    type: 'longtext',
    section: 'renovation',
  },
  {
    id: 'exterior_budget',
    notion: 'Exterior Spaces & Amenities Budget',
    label: 'Exterior spaces & amenities budget',
    type: 'text',
    section: 'renovation',
  },

  // ---- Style & Inspiration ------------------------------------------------
  {
    id: 'inspiration_files',
    notion: 'Inspiration References (Files)',
    label: 'Inspiration photos',
    type: 'files',
    uploadKind: 'inspiration',
    section: 'style',
    required: true,
    help: 'Rooms, styles, or details you love. Screenshots from Pinterest, Instagram, or Airbnb listings all work. We cannot start your mood board without these.',
  },
  {
    id: 'inspiration_notes',
    notion: 'Inspiration References (Notes / Links)',
    label: 'Inspiration links or notes',
    type: 'longtext',
    section: 'style',
    help: 'Pinterest boards, saved listings, anything that did not upload cleanly.',
  },
  {
    id: 'style_categories',
    notion: 'Style Categories',
    label: 'Style categories',
    type: 'multiselect',
    section: 'style',
    options: ['Coastal', 'Modern', 'Boho', 'Southwestern', 'Rustic', 'Industrial', 'Minimalist', 'Other'],
  },
  { id: 'colors_you_love', notion: 'Colors You Love', label: 'Colors you love', type: 'longtext', section: 'style' },
  {
    id: 'dislikes',
    notion: 'Dislikes (Styles / Colors / Concepts)',
    label: 'Styles, colors, or concepts you dislike',
    type: 'longtext',
    section: 'style',
  },
  {
    id: 'absolute_nos',
    notion: 'Absolute No’s (Colors / Elements)',
    label: 'Absolute no’s',
    type: 'longtext',
    section: 'style',
    help: 'The things that would make you reject a design outright. Being blunt here saves a revision round.',
  },
  {
    id: 'theme_vs_vibe',
    notion: 'Theme vs Vibe Direction',
    label: 'Theme or vibe direction',
    type: 'longtext',
    section: 'style',
    help: 'A theme is literal (surf shack, ski lodge). A vibe is a feeling. Either is valid. We just need to know which you want.',
  },
  {
    id: 'murals',
    notion: 'Interested In Murals / Wallpaper?',
    label: 'Interested in murals or wallpaper?',
    type: 'select',
    section: 'style',
    options: ['Yes', 'No'],
  },
  {
    id: 'mural_property_name',
    notion: 'If Murals: Add Property Name?',
    label: 'If yes, add the property name to it?',
    type: 'select',
    section: 'style',
    options: ['Yes', 'No'],
    dependsOn: { id: 'murals', equals: 'Yes' },
  },
  {
    id: 'wow_factors',
    notion: 'WOW Factors / Focal Points',
    label: 'WOW factors and focal points',
    type: 'longtext',
    section: 'style',
  },
]

export const QUESTIONS_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))

export const REQUIRED_IDS = QUESTIONS.filter((q) => q.required).map((q) => q.id)

/** Questions that carry file uploads, in form order. */
export const UPLOAD_QUESTIONS = QUESTIONS.filter((q) => q.type === 'files')

export function questionsForSection(sectionId) {
  return QUESTIONS.filter((q) => q.section === sectionId)
}

/**
 * True when a conditional question is currently in play. A question hidden by its
 * own condition must never be treated as unanswered — nothing depends on one today
 * that is also required, but validation and the brief both consult this so adding
 * such a pair later does not quietly break either.
 */
export function isQuestionActive(question, answers) {
  const dep = question.dependsOn
  if (!dep) return true
  return normalizeAnswer(QUESTIONS_BY_ID.get(dep.id), answers?.[dep.id]) === dep.equals
}

/**
 * Coerce one raw answer into its storage shape, or null when blank.
 *
 * Returns null rather than '' or 0 for absent values so "did they answer this?"
 * is a single check everywhere. Note that a real 0 (zero bedrooms) survives — the
 * blank test is on the trimmed string, not on falsiness.
 */
/**
 * Keep only http(s) URLs. The file `url` is client-supplied and lands in an href
 * in the design brief, so a `javascript:` or `data:` value would be written into
 * a document Soraia opens. Anything else is dropped and the id-derived Drive link
 * is used instead.
 */
export function safeHttpUrl(value) {
  if (!value) return null
  try {
    const u = new URL(String(value))
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

export function normalizeAnswer(question, raw) {
  if (!question) return null
  if (raw === undefined || raw === null) return null

  if (question.type === 'files') {
    if (!Array.isArray(raw)) return null
    const files = raw
      .map((f) => (typeof f === 'string' ? { name: f } : f))
      .filter((f) => f && typeof f.name === 'string' && f.name.trim())
      .map((f) => ({
        name: String(f.name).trim(),
        id: f.id ? String(f.id) : null,
        url: safeHttpUrl(f.url) || (f.id ? `https://drive.google.com/file/d/${String(f.id)}/view` : null),
      }))
    return files.length ? files : null
  }

  if (question.type === 'multiselect') {
    const list = (Array.isArray(raw) ? raw : [raw])
      .map((v) => String(v).trim())
      .filter(Boolean)
      .filter((v) => !question.options || question.options.includes(v))
    return list.length ? list : null
  }

  const text = String(raw).trim()
  if (!text) return null

  if (question.type === 'number') {
    const n = Number(text.replace(/,/g, ''))
    return Number.isFinite(n) ? n : null
  }
  if (question.type === 'select') {
    return question.options?.includes(text) ? text : null
  }
  return text
}

/** Normalize a whole submission. Unknown keys are dropped. */
export function normalizeAnswers(raw = {}) {
  const out = {}
  for (const q of QUESTIONS) {
    const value = normalizeAnswer(q, raw[q.id])
    if (value !== null) out[q.id] = value
  }
  return out
}

/**
 * Has a required file question actually been satisfied?
 *
 * A filename alone is not evidence: the answers payload is client-supplied, so
 * `[{name:'kitchen.jpg'}]` with nothing behind it would otherwise pass and the
 * brief would claim inspiration photos that are not in Drive. A real upload comes
 * back from /api/intake-upload-url with a Drive file id, so that is what counts.
 *
 * (June's tracker gates the mood board on Drive itself, not on this, so a forged
 * list never actually unblocks the work — but it would put a lie in the brief.)
 */
function fileAnswerSatisfied(value) {
  return Array.isArray(value) && value.some((f) => f && f.id)
}

/**
 * Check the four required answers are present.
 * Returns {ok:true, answers} or {ok:false, missing:[{id,label}]}.
 */
export function validateAnswers(raw = {}) {
  const answers = normalizeAnswers(raw)
  const missing = QUESTIONS
    .filter((q) => {
      if (!q.required || !isQuestionActive(q, answers)) return false
      const value = answers[q.id]
      if (value == null) return true
      return q.type === 'files' ? !fileAnswerSatisfied(value) : false
    })
    .map((q) => ({ id: q.id, label: q.label }))
  return missing.length ? { ok: false, missing } : { ok: true, answers }
}

/** Human-readable form of one normalized answer, for the brief and the Sheet. */
export function formatAnswer(question, value) {
  if (value === null || value === undefined) return ''
  if (question.type === 'files') return value.map((f) => f.name).join(', ')
  if (question.type === 'multiselect') return value.join(', ')
  return String(value)
}
