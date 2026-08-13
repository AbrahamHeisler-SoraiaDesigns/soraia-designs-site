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

import { makeSchema } from './intake-schema.js'

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

const schema = makeSchema({
  id: 'str',
  title: 'STR onboarding',
  intro:
    'Four questions are required: your name, the address, your furnishings budget, and your ' +
    'inspiration photos. Everything else helps, but leave blank anything you are unsure about. ' +
    'Your answers save as you go, so you can finish this later on the same device.',
  doneMessage:
    'Your photos are filed and Soraia has what she needs to start your mood board. If anything ' +
    'changes, reopen your link and submit again. It updates rather than duplicates.',
  sections: SECTIONS,
  questions: QUESTIONS,
})

export default schema

// Re-exported individually because these were the module's public surface before
// the engine was extracted, and four consumers plus the test suite import them by
// name. The behaviour is now shared with the new-construction form — see
// intake-schema.js.
export const {
  QUESTIONS_BY_ID,
  REQUIRED_IDS,
  UPLOAD_QUESTIONS,
  questionsForSection,
  isQuestionActive,
  normalizeAnswer,
  normalizeAnswers,
  validateAnswers,
  formatAnswer,
  safeHttpUrl,
} = schema
