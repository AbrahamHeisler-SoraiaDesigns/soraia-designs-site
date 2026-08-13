// The new-construction intake.
//
// A separate questionnaire from the STR onboarding, not a variant of it. The STR
// form asks about guests, ADR, and what photographs well. A custom home has none
// of those and asks instead about how a family actually lives in a house.
//
// REUSABLE BY DESIGN. v1 of this form was written around one client's discovery
// call, down to quoting them back to themselves. Soraia's read (2026-08-13) was
// that it was awkward and far too particular, and she was right: a form that only
// works after a two-hour call is not a process, it is a one-off. Nothing here
// names a client, references a specific property, or assumes we have already
// spoken. It should be sendable to anyone who signs a new-build engagement.
//
// WHY THESE QUESTIONS AND NOT MORE
//
// v1 asked 79. This asks 23, and the cut was not arbitrary: Soraia went through
// the long version and kept the ones that change what she draws. The survivors are
// mostly about how people actually live, because that is what she carries into the
// architect conversation. Finish selections come later, per property, once there
// are drawings to put them on. Resist regrowing this form. If a question does not
// change a layout, a budget, or a shortlist, it belongs in a call.
//
// Question ids are stable and referenced by the master Sheet's column headers via
// their labels. Renaming a label starts a new column; renaming an id orphans the
// old answers. Do neither casually.
import { makeSchema } from './intake-schema.js'

export const SECTIONS = [
  {
    id: 'basics',
    title: 'The Basics',
    blurb: 'Quick. Four lines and you are through it.',
  },
  {
    id: 'living',
    title: 'How You Live',
    blurb: 'The part people skip and then regret. This is what makes a house work rather than just look good.',
  },
  {
    id: 'kitchen',
    title: 'Kitchen and Hosting',
    blurb: 'How you cook and who comes over. Both of these change the plan, not just the finishes.',
  },
  {
    id: 'bathrooms',
    title: 'Bathrooms and Laundry',
    blurb: 'Rooms where the plumbing has to be right before anything is beautiful.',
  },
  {
    id: 'direction',
    title: 'Look and Feel',
    blurb: 'Show us more than you tell us.',
  },
  {
    id: 'practical',
    title: 'Money and Process',
    blurb: 'How we spend it and how we work together.',
  },
]

export const QUESTIONS = [
  // ---- The Basics ---------------------------------------------------------
  {
    id: 'full_name',
    label: 'Your names',
    type: 'text',
    section: 'basics',
    required: true,
    help: 'Everyone we should be addressing, however you would like to be addressed.',
  },
  {
    id: 'project_address',
    label: 'Project address',
    type: 'text',
    section: 'basics',
    required: true,
  },
  {
    id: 'contact_details',
    label: 'Best email and mobile for each of you',
    type: 'longtext',
    section: 'basics',
    help: 'So selections and approvals reach the right person without a forward in the middle.',
  },
  {
    id: 'build_stage',
    label: 'Where is the build right now, and when do you hope to move in?',
    type: 'longtext',
    section: 'basics',
    // Determines everything about sequencing. A house with no drawings needs
    // layout input first; a house already framed needs finishes yesterday.
    help: 'Plans not drawn yet, in design with an architect, permitted, already under construction? A rough move-in target is fine, a season is fine.',
  },

  // ---- How You Live -------------------------------------------------------
  {
    id: 'household',
    label: 'Who lives here full time?',
    type: 'longtext',
    section: 'living',
    help: 'Adults, children and their ages, pets and their sizes.',
  },
  {
    id: 'overnight_guests',
    label: 'Who stays over, how often, and for how long?',
    type: 'longtext',
    section: 'living',
    help: 'Parents, grown children, friends. Should they be able to come and go without crossing paths with you?',
  },
  {
    id: 'work_from_home',
    label: 'Does anyone work from home?',
    type: 'longtext',
    section: 'living',
    help: 'How many of you, and what does that space actually need? A door that closes, a wall that looks right on video, room for two screens, quiet.',
  },
  {
    id: 'weekday_morning',
    label: 'Walk us through a normal weekday morning',
    type: 'longtext',
    section: 'living',
    help: 'Where everyone goes, in what order, from waking up to out the door. Boring detail is the useful kind.',
  },
  {
    id: 'current_home_loves',
    label: 'What do you love about how your current home works?',
    type: 'longtext',
    section: 'living',
    help: 'Not how it looks. How it works. The things you would be sorry to lose.',
  },
  {
    id: 'current_home_gripes',
    label: 'What makes you think "why did they do that?"',
    type: 'longtext',
    section: 'living',
    // The highest-value answer on the form. Kept from v1 on Soraia's request,
    // rephrased so it works for someone we have never spoken to.
    help: 'Every house has at least one. Where a door swings, the outlet you can never reach, the walk from the car to the fridge, the room nobody uses. List all of them. The pettier the better, because on paper these are free to fix and later they are not.',
  },
  {
    id: 'never_had',
    label: 'What have you always wanted in a home and never had?',
    type: 'longtext',
    section: 'living',
  },

  // ---- Kitchen and Hosting ------------------------------------------------
  {
    id: 'cooking',
    label: 'How much do you genuinely cook, and who does it?',
    type: 'longtext',
    section: 'kitchen',
    // Sizes the kitchen and settles walk-in pantry versus cabinet, which is a
    // floor-plan decision rather than a finish one.
    help: 'Be honest rather than aspirational. Somebody who cooks properly four nights a week needs a different kitchen and a much bigger pantry than somebody who mostly reheats, and we would rather build the one you will actually use.',
  },
  {
    id: 'hosting',
    label: 'How often do you host, and for how many?',
    type: 'longtext',
    section: 'kitchen',
    help: 'Seated dinners, or everyone standing around the island? Holidays only, or most weekends?',
  },
  {
    id: 'coffee_and_wine',
    label: 'Coffee and wine',
    type: 'longtext',
    section: 'kitchen',
    help: 'Is coffee a daily ritual worth building a station for, and where should it live? Do you keep wine, roughly how much, and should it be on display or put away?',
  },
  {
    id: 'kitchen_details',
    label: 'Where should the microwave go, and which built-ins do you actually want?',
    type: 'longtext',
    section: 'kitchen',
    help: 'Microwave in the island, up in the cabinets, or tucked in the pantry? And of the usual extras, which are worth it to you and which are just a cabinet you lost: pull-out trash, spice storage, tray dividers, appliance garage, charging drawer, deep drawers instead of lower cupboards.',
  },

  // ---- Bathrooms and Laundry ----------------------------------------------
  {
    id: 'primary_bath_config',
    label: 'Primary bathroom, roughly what shape?',
    type: 'select',
    section: 'bathrooms',
    options: [
      'Freestanding tub and a separate shower',
      'Oversized shower, no tub',
      'Wet room, tub and shower together behind one screen',
      'Tub only',
      'Not sure yet, show us the options',
    ],
    // The tub question is worth asking bluntly. A freestanding tub nobody uses is
    // one of the most common regrets in a custom build, and it costs floor area
    // that the shower usually wants.
    help: 'Worth being honest about the tub. If you have not taken a bath in three years, we would rather give that space to the shower.',
  },
  {
    id: 'shower_features',
    label: 'In the shower, which of these are real for you?',
    type: 'multiselect',
    section: 'bathrooms',
    options: [
      'Rain head overhead',
      'Handheld on a slide bar',
      'Body sprays',
      'Steam',
      'Built-in bench or seat',
      'Two shower heads',
      'Heated floor',
      'Keep it simple',
    ],
    help: 'Pick what you would use weekly. Everything here has to be roughed in before the walls close, so it is much cheaper to decide now than to want it later.',
  },
  {
    id: 'laundry',
    label: 'Laundry, honestly',
    type: 'longtext',
    section: 'bathrooms',
    help: 'How many loads a week, who does them, and where should it live? Upstairs near the bedrooms, downstairs by the mudroom, or both. Anything you want in there beyond the machines: a folding counter, a sink, hanging space, a pet wash.',
  },

  // ---- Look and Feel ------------------------------------------------------
  {
    id: 'inspiration_files',
    label: 'Inspiration photos',
    type: 'files',
    uploadKind: 'inspiration',
    section: 'direction',
    required: true,
    help: 'Anything you have saved. Screenshots are fine, blurry is fine, contradictory is fine. We would rather see twenty confusing images than read three tidy sentences.',
  },
  {
    id: 'inspiration_links',
    label: 'Pinterest boards, Instagram saves, listing links',
    type: 'longtext',
    section: 'direction',
    help: 'Paste them all. A board that feels messy or off-brief is still useful to us.',
  },
  {
    id: 'style_words',
    label: 'Five words for how the house should feel, and anything that is a hard no',
    type: 'longtext',
    section: 'direction',
    help: 'The second half matters as much as the first. What would make you walk in and think "this is not us"?',
  },

  // ---- Money and Process --------------------------------------------------
  {
    id: 'spend_vs_save',
    label: 'Where should the money show, and where does it genuinely not matter?',
    type: 'longtext',
    section: 'practical',
    help: 'Be blunt. This single answer saves more back and forth than anything else on this form. If your builder has already set allowances we should design inside of, tell us those too.',
  },
  {
    id: 'decisions_and_turnaround',
    label: 'Who decides what, and how quickly can you approve things?',
    type: 'longtext',
    section: 'practical',
    help: 'Is it joint, or does one of you own certain categories? And give us the real turnaround rather than the polite one. The schedule is built on it.',
  },
  {
    id: 'future_proofing',
    label: 'Anything to design in now that you would want in fifteen years?',
    type: 'longtext',
    section: 'practical',
    help: 'Blocking behind bathroom walls so a grab bar can go up later, a zero-threshold shower, wider doorways, a flexible room on the ground floor. All of it costs almost nothing while the walls are on paper and a great deal afterwards, even if you never use it.',
  },
]

const schema = makeSchema({
  id: 'newbuild',
  title: 'New construction',
  intro:
    'This is about how you live, not about tile. Twenty-odd questions, most of them short, ' +
    'and it should take you twenty minutes. Only three are required: your names, the address, ' +
    'and some inspiration photos. Skip anything you are unsure about, and your answers save as ' +
    'you go, so you can put it down and come back on the same device.',
  doneMessage:
    'That is what we need to get started. Your photos are filed and your designer has what she ' +
    'needs for the first conversation about your plan. If anything changes, reopen your link and ' +
    'submit again. It updates rather than duplicates.',
  sections: SECTIONS,
  questions: QUESTIONS,
})

export default schema

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
} = schema
