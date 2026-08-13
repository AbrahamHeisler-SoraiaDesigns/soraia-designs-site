// The new-construction intake — part 1.
//
// A separate questionnaire from the STR onboarding, not a variant of it. The STR
// form asks about guests, ADR, and what photographs well. A custom home has none
// of those and asks instead about how a family actually lives in a house.
//
// WHY THIS FORM IS ORDERED THE WAY IT IS
//
// On the 8/13 Dickman call, Rachel said: "it feels weird to be talking about this
// and we don't have a house design." She is right — the architect has not drawn it
// yet. Soraia's first job is layout with the architect (kitchen plan, gas line,
// water line, electrical) *before* finishes. So part 1 asks only what feeds that
// conversation: how they live, what drives the plan, and the direction. Tile,
// faucets, and hardware are part 2, unlocked once there are drawings — asking them
// now would produce answers nobody can hold to and walk straight into the one
// thing the client is anxious about.
//
// Part 2 lives in a separate file when it is built. Do not append it here.
//
// The `call` field on a question records what we already heard, so the form can
// ask the client to CONFIRM rather than retype it. Those strings are quoted from
// the transcript (01KZY11CEH64ARCBJPD6V18VX3) — they are evidence, not copy.
// Correct one only against the transcript, never against a recollection.
import { makeSchema } from './intake-schema.js'

export const SECTIONS = [
  {
    id: 'basics',
    title: 'The Basics',
    blurb: 'Quick. Most of this we have already — just confirming we have it right.',
  },
  {
    id: 'reference',
    title: 'The House You Loved',
    blurb: 'You told us a lot about 502 Davis. Rather than make you say it twice, tell us where we got it wrong.',
  },
  {
    id: 'plan',
    title: 'The Plan, So Far',
    blurb: 'The architect has not drawn it yet. These answers are what we bring to that first conversation.',
  },
  {
    id: 'living',
    title: 'How You Actually Live',
    blurb: 'The half people skip and then regret. This is what makes a house work instead of just look good.',
  },
  {
    id: 'kitchen',
    title: 'The Kitchen — Layout Only',
    blurb: 'Not colours or counters yet. Just where things go, because that has to be right before anything is drawn.',
  },
  {
    id: 'inspiration',
    title: 'Inspiration',
    blurb: 'Show us more than you tell us. Anything you have saved, however messy.',
  },
  {
    id: 'direction',
    title: 'The Feel',
    blurb: 'How the finished house should land when someone walks in.',
  },
  {
    id: 'working',
    title: 'Working Together',
    blurb: 'How you want decisions to run, and when you are reachable.',
  },
  {
    id: 'budget',
    title: 'Money',
    blurb: 'Where it should show, and where it truly does not matter.',
  },
  {
    id: 'gutcheck',
    title: 'Last Four',
    blurb: 'The ones that usually tell us the most.',
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
    help: 'Both of you — however you would like to be addressed.',
  },
  {
    id: 'project_address',
    label: 'Project address',
    type: 'text',
    section: 'basics',
    required: true,
  },
  {
    id: 'contact_emails',
    label: 'Best email and mobile for each of you',
    type: 'longtext',
    section: 'basics',
    help: 'So selections and approvals reach the right person without a forward in the middle.',
  },
  {
    id: 'sample_address',
    label: 'Where should we ship material samples?',
    type: 'longtext',
    section: 'basics',
    // Rachel, 15:25: "I like to go and see things in person." Soraia's answer at
    // 15:41 was to ship samples and then make one trip down with everything
    // gathered — which only works if we know where to send them.
    help: 'We order samples and send them to you rather than asking you to chase them down. Whichever address you are actually at.',
  },
  {
    id: 'target_move_in',
    label: 'Target move-in',
    type: 'text',
    section: 'basics',
    help: 'A season is fine if a date is not real yet.',
  },
  {
    id: 'square_footage',
    label: 'Approximate finished square footage',
    type: 'number',
    section: 'basics',
  },
  {
    id: 'architect',
    label: 'Architect — name, and should we be copied on their drawings?',
    type: 'longtext',
    section: 'basics',
    help: 'Soraia works alongside the architect from the start so the gas, water, and electrical land where the design needs them.',
  },

  // ---- The House You Loved ------------------------------------------------
  // Rachel itemised 502 Davis unprompted at 07:01-07:42. That list is the closest
  // thing to a brief that exists. Every confirm below is a direct quote, so the
  // question is one tap unless we heard it wrong.
  {
    id: 'davis_layout',
    label: '502 Davis — the layout',
    type: 'confirm',
    section: 'reference',
    call: 'You said the layout was the big one — "it was layout a lot".',
  },
  {
    id: 'davis_island_colour',
    label: '502 Davis — colour on the island',
    type: 'confirm',
    section: 'reference',
    call: 'You liked the island being a different colour from the rest of the kitchen.',
  },
  {
    id: 'davis_niche',
    label: '502 Davis — the upstairs niche',
    type: 'confirm',
    section: 'reference',
    call: 'You liked the niche upstairs with the tile behind it, and the pop of colour there.',
  },
  {
    id: 'davis_no_wet_bar',
    label: '502 Davis — but no wet bar',
    type: 'confirm',
    section: 'reference',
    call: 'You liked how that niche looked, but said you do not see yourselves using a wet bar. So: the look, not the bar.',
  },
  {
    id: 'davis_cabinets',
    label: 'Cabinets — mid-tone neutral',
    type: 'confirm',
    section: 'reference',
    call: '"Neutral cabinets — not too dark, not too blonde."',
  },
  {
    id: 'davis_arches',
    label: 'Arches',
    type: 'confirm',
    section: 'reference',
    call: 'You like them.',
  },
  {
    id: 'davis_beams',
    label: 'Wood beams, not coffered ceilings',
    type: 'confirm',
    section: 'reference',
    call: 'Wood beams over the alternative — and coffered ceilings "look heavy".',
  },
  {
    id: 'davis_waterfall',
    label: 'Waterfall countertop',
    type: 'confirm',
    section: 'reference',
    call: 'You liked the waterfall edge.',
  },
  {
    id: 'no_gold',
    label: 'No gold on the fixtures',
    type: 'confirm',
    section: 'reference',
    // The one thing on this form that must not be softened. Rachel, 23:23: "we had
    // gold faucets, like the really bright brass gold faucets in our very first
    // house. And I'm like, I can't do it again." The toned-down gold Soraia showed
    // was another client's house.
    call: 'Matte black or stainless. No gold — you had bright brass in your first house and are not doing it again.',
    help: 'If this rule holds for cabinet hardware, door hardware, and light fixtures too, say so — it changes what we shortlist everywhere.',
  },
  {
    id: 'davis_front_door',
    label: 'The front door — what specifically?',
    type: 'longtext',
    section: 'reference',
    help: 'You said you loved the one at 502 Davis. Was it the material, the size, the amount of glass, or the whole thing? If it is mostly glass — do you want it left clear, or treated for privacy?',
  },
  {
    id: 'davis_dislikes',
    label: 'What did you NOT like about 502 Davis?',
    type: 'longtext',
    section: 'reference',
    // Nobody asked this on the call. We only ever heard the good half, and the
    // half a client leaves out is usually the half that causes a revision round.
    help: 'We only ever heard the good half. Anything that was off, or that you would change if it were yours?',
  },
  {
    id: 'james_floor_tile',
    label: 'The floor tile that read "too formal"',
    type: 'longtext',
    section: 'reference',
    help: 'On the call you liked the wall tile in the house Soraia showed, but said the floor tile was too formal. What made it feel that way? Pattern, sheen, the size, the colour?',
  },

  // ---- The Plan, So Far ---------------------------------------------------
  {
    id: 'primary_downstairs',
    label: 'Primary bedroom downstairs',
    type: 'confirm',
    section: 'plan',
    call: 'The primary is going on the ground floor.',
  },
  {
    id: 'bedroom_count',
    label: 'Four bedrooms, or five if it fits?',
    type: 'longtext',
    section: 'plan',
    help: 'This was still open on our call. Where has it landed since?',
  },
  {
    id: 'upstairs_layout',
    label: 'How should upstairs work?',
    type: 'longtext',
    section: 'plan',
    help: 'You floated two ensuites plus a jack-and-jill. Still the plan? And who actually sleeps in each of those rooms — kids, guests, both?',
  },
  {
    id: 'upstairs_landing',
    label: 'The upstairs landing',
    type: 'longtext',
    section: 'plan',
    help: 'One of you wanted an area upstairs that all the bedrooms open onto. What is it for — somewhere the kids hang out, a second living room, a study space, or just breathing room at the top of the stairs?',
  },
  {
    id: 'bedroom_or_den',
    label: 'If you could only have one — the fifth bedroom or the upstairs landing?',
    type: 'select',
    section: 'plan',
    options: ['The fifth bedroom', 'The upstairs landing', 'Genuinely torn'],
    help: 'Square footage always runs out somewhere. Better we know now which way you would rather it go.',
  },
  {
    id: 'aging_in_place',
    label: 'Anything to build in now that you would want in fifteen years?',
    type: 'longtext',
    section: 'plan',
    // Sam raised this himself at 03:56 — wall ovens because they are "easier
    // getting the food in and out as we get older." Worth asking straight while
    // the walls are still on paper.
    help: 'You already mentioned wall ovens being easier as you get older. Same thinking applied to the house: blocking behind bathroom walls for grab bars later, a zero-threshold shower, wider doorways, a flex room on the primary level. All cheap now and expensive later — even if you never use them.',
  },

  // ---- How You Actually Live ----------------------------------------------
  {
    id: 'why_is_that_there',
    label: 'Every "why is that there?" you have ever had',
    type: 'longtext',
    section: 'living',
    // Rachel's own frame, 19:26: "every house that we've lived in… why did they do
    // that? Why is that there? Why don't I have this?" She handed us the question;
    // this is the highest-value answer in part 1.
    help: 'You said it yourself: every house you have lived in has had at least one "why did they do that?". List them. All of them, from every house. Be petty — petty is exactly what is useful here, and it is what Soraia takes into the architect meeting.',
  },
  {
    id: 'why_dont_i_have_this',
    label: 'And every "why don\'t I have this?"',
    type: 'longtext',
    section: 'living',
    help: 'The thing you have wanted in every house and never had.',
  },
  {
    id: 'weekday_morning',
    label: 'Walk us through a normal weekday morning',
    type: 'longtext',
    section: 'living',
    help: 'Where you go, in what order, from waking up to out the door. Boring detail is the good stuff.',
  },
  {
    id: 'weeknight_dinner',
    label: 'And a weeknight dinner',
    type: 'longtext',
    section: 'living',
    help: 'Who cooks, where everyone ends up, where you actually eat it.',
  },
  {
    id: 'annoying_trip',
    label: 'The most annoying trip you make in your current house',
    type: 'longtext',
    section: 'living',
    help: 'Soraia has seen houses where you walk around the whole island to reach the fridge. What is yours?',
  },
  {
    id: 'household',
    label: 'Who lives here full time',
    type: 'longtext',
    section: 'living',
    help: 'Adults, kids and their ages, pets and their sizes.',
  },
  {
    id: 'guests',
    label: 'Who stays over, how often, and for how long?',
    type: 'longtext',
    section: 'living',
    help: 'Parents, grown kids, friends. Do they need to be able to come and go without crossing paths with you?',
  },
  {
    id: 'drop_zone',
    label: 'Where do keys, mail, shoes, bags, and leashes land?',
    type: 'longtext',
    section: 'living',
    help: 'Where they land now, and where you wish they landed.',
  },
  {
    id: 'groceries',
    label: 'Groceries — car to pantry',
    type: 'longtext',
    section: 'living',
    help: 'How that trip should go. It is one of the few things a floor plan can fix permanently.',
  },
  {
    id: 'work_from_home',
    label: 'Anyone working from home?',
    type: 'longtext',
    section: 'living',
    help: 'How many of you, and does it need a door that closes, a video-call wall, a second screen, quiet?',
  },
  {
    id: 'laundry_habits',
    label: 'Laundry, honestly',
    type: 'longtext',
    section: 'living',
    help: 'How many loads a week, who does them, and should it be upstairs, downstairs, or both?',
  },
  {
    id: 'doors_that_close',
    label: 'Which rooms need a door that closes?',
    type: 'longtext',
    section: 'living',
    help: 'Open plans are lovely until someone is on a call and someone else is running the blender.',
  },

  // ---- The Kitchen, Layout Only -------------------------------------------
  {
    id: 'who_cooks',
    label: 'Who cooks, and how often is it a real meal?',
    type: 'longtext',
    section: 'kitchen',
  },
  {
    id: 'entertaining',
    label: 'How you entertain',
    type: 'longtext',
    section: 'kitchen',
    help: 'How often, how many people, and is it a seated dinner or everyone standing around the island?',
  },
  {
    id: 'island_use',
    label: 'The island — seating, or work surface?',
    type: 'select',
    section: 'kitchen',
    options: ['Seating and prep both', 'Mostly seating', 'Work surface only, seating elsewhere', 'Not sure yet'],
  },
  {
    id: 'island_seats',
    label: 'How many seats at the island?',
    type: 'number',
    section: 'kitchen',
  },
  {
    id: 'island_extras',
    label: 'Prep sink or second dishwasher in the island?',
    type: 'longtext',
    section: 'kitchen',
    help: 'Both change the plumbing, so they are a now decision rather than a later one.',
  },
  {
    id: 'wall_ovens',
    label: 'Wall ovens again',
    type: 'confirm',
    section: 'kitchen',
    call: 'You run two Bosch wall ovens in Florida and prefer them to a range — easier getting food in and out.',
    help: 'Same brand again, or open to alternatives at the same level?',
  },
  {
    id: 'not_showpiece',
    label: 'Good and durable, not showpiece',
    type: 'confirm',
    section: 'kitchen',
    call: 'You said the other house you looked at was over the top — you do not need a $17,000 oven.',
  },
  {
    id: 'cooking_fuel',
    label: 'Range or cooktop, and gas or induction?',
    type: 'select',
    section: 'kitchen',
    options: [
      'Gas cooktop',
      'Induction cooktop',
      'Gas range',
      'Dual fuel range',
      'Not sure — talk us through it',
    ],
    help: 'This one genuinely has to be decided early: it determines whether a gas line runs to that wall at all.',
  },
  {
    id: 'fridge_type',
    label: 'Refrigeration',
    type: 'select',
    section: 'kitchen',
    options: [
      'Standard freestanding',
      'Counter-depth',
      'Built-in columns (separate fridge and freezer)',
      'Not sure yet',
    ],
  },
  {
    id: 'beverage_wishlist',
    label: 'Beverage fridge, wine storage, ice maker, built-in coffee — which are real?',
    type: 'longtext',
    section: 'kitchen',
    help: 'Real means you would use it weekly. Everything else is a cabinet you lost.',
  },
  {
    id: 'pantry',
    label: 'Pantry',
    type: 'longtext',
    section: 'kitchen',
    help: 'Walk-in or cabinet? Should it be a proper working room — sink, outlets, small appliances living out on the counter — or finished to match the kitchen?',
  },
  {
    id: 'microwave_coffee',
    label: 'Where do the microwave and the coffee live?',
    type: 'longtext',
    section: 'kitchen',
    help: 'Both are used daily and both are ugly. Worth deciding on purpose.',
  },
  {
    id: 'kitchen_conveniences',
    label: 'Built-in conveniences — which do you want, and which are clutter?',
    type: 'longtext',
    section: 'kitchen',
    // Sam's spice-rack line got a laugh on the call, but the question under it is
    // real and it is cabinetry-order timing, not a later decision.
    help: 'Pull-out trash, spice storage, tray dividers, appliance garage, charging drawer, deep drawers instead of lower cabinets. Some people want all of it, some find it fussy.',
  },

  // ---- Inspiration --------------------------------------------------------
  {
    id: 'inspiration_files',
    label: 'Inspiration photos',
    type: 'files',
    uploadKind: 'inspiration',
    section: 'inspiration',
    required: true,
    help: 'Anything you have saved. Screenshots are fine, blurry is fine, contradictory is fine — we would rather see twenty confusing images than read three tidy sentences.',
  },
  {
    id: 'your_own_remodels',
    label: 'Your own remodels — photos, and the parts you would not repeat',
    type: 'longtext',
    section: 'inspiration',
    // Rachel offered this at 21:45 and volunteered the second half herself: "there's
    // elements that I wouldn't do again." That half is worth more than the photos.
    help: 'You mentioned the two bathrooms and the laundry room you did, and that your primary bath there is your favourite thing you have ever remodelled. Upload those above if you can — and tell us the part you said out loud on our call: which elements you would not do again, and why.',
  },
  {
    id: 'inspiration_links',
    label: 'Pinterest, Instagram, listings',
    type: 'longtext',
    section: 'inspiration',
    help: 'Paste the links. A board that feels messy or off-brief is still useful to us.',
  },
  {
    id: 'places_you_love',
    label: 'Hotels, restaurants, or houses you would copy',
    type: 'longtext',
    section: 'inspiration',
    help: 'Somewhere you have actually stood in and remembered.',
  },
  {
    id: 'copy_wholesale',
    label: 'One room you would take exactly as it is',
    type: 'longtext',
    section: 'inspiration',
    help: 'No changes, no notes.',
  },

  // ---- The Feel -----------------------------------------------------------
  {
    id: 'style_words',
    label: 'Timeless, contemporary, quality over flash',
    type: 'confirm',
    section: 'direction',
    call: 'That is how you described it on our call.',
    help: 'Add or swap words if that is not quite it.',
  },
  {
    id: 'dated_line',
    label: 'Where is your line on trends?',
    type: 'longtext',
    section: 'direction',
    help: 'You said you do not want it to look dated and do not want anything super trendy. If something is beautiful now but reads as 2026 in eight years — is that a hard no everywhere, or fine in the small stuff like a light fixture?',
  },
  {
    id: 'spanish_portuguese',
    label: 'The Spanish/Portuguese read — right or were we projecting?',
    type: 'longtext',
    section: 'direction',
    help: 'Soraia grew up with that architecture and heard it in what you liked. Does that language fit, or does it not sound like your house?',
  },
  {
    id: 'warm_or_cool',
    label: 'Warm or cool overall?',
    type: 'select',
    section: 'direction',
    options: ['Warm', 'Cool', 'Somewhere in the middle', 'Different by room'],
  },
  {
    id: 'quiet_or_contrast',
    label: 'Quiet and layered, or high contrast?',
    type: 'select',
    section: 'direction',
    options: [
      'Mostly neutral, with a few moments',
      'Colour and pattern throughout',
      'High contrast — dark against light',
      'Not sure, show us both',
    ],
  },
  {
    id: 'natural_material',
    label: 'How much wood, stone, and plaster do you want to actually see?',
    type: 'longtext',
    section: 'direction',
    help: 'Some people want texture everywhere. Some want smooth and painted with a few natural moments.',
  },
  {
    id: 'timeless_vs_practical',
    label: 'If timeless and practical ever fight, which wins?',
    type: 'longtext',
    section: 'direction',
    // Rachel wants both, explicitly, at 19:26. Naming the tension now is cheaper
    // than discovering it in a revision round.
    help: 'You said you want it timeless AND well laid out. Usually that is fine. Occasionally a room can be beautiful or practical but not both — when that happens, which way should we go?',
  },
  {
    id: 'room_priorities',
    label: 'Which rooms do you actually care about?',
    type: 'longtext',
    section: 'direction',
    help: 'Rank them, roughly. And which ones are purely functional — tell us not to overthink those.',
  },
  {
    id: 'fixed_picture',
    label: 'Any room you already have a fixed picture of in your head?',
    type: 'longtext',
    section: 'direction',
    help: 'Worth saying now. It is much harder to hear at the presentation.',
  },

  // ---- Working Together ---------------------------------------------------
  {
    id: 'decision_maker',
    label: 'How decisions get made',
    type: 'confirm',
    section: 'working',
    call: 'Interiors are mostly Rachel’s call, and the pattern is that she narrows it to two options she likes and Sam picks.',
    help: 'Any category where that flips — appliances, tech, the garage, the outside?',
  },
  {
    id: 'turnaround',
    label: 'Approval turnaround you can actually hold',
    type: 'select',
    section: 'working',
    options: ['Same day', '2 business days', 'About a week', 'Depends entirely on the week'],
    help: 'Your agreement says two business days. We would rather know the real number than the polite one — the schedule is built on it.',
  },
  {
    id: 'travel_dates',
    label: 'Travel and blackout dates over the next 90 days',
    type: 'longtext',
    section: 'working',
    help: 'We know about next Wednesday through Friday. What else?',
  },
  {
    id: 'best_times',
    label: 'Best days and times for review calls',
    type: 'longtext',
    section: 'working',
    help: 'You are an hour behind us, so we would rather get this right than keep guessing.',
  },
  {
    id: 'seeing_in_person',
    label: 'Seeing materials in person',
    type: 'longtext',
    section: 'working',
    help: 'You mentioned you like to see things in person and have a tile shop you use locally. Our plan is to ship you samples as we go, then make one trip down with everything gathered so you can see it all together. Does that work? And is there anything you have already seen and loved — brand, collection, or just a phone photo?',
  },
  {
    id: 'how_to_present',
    label: 'How would you rather receive selections?',
    type: 'select',
    section: 'working',
    options: [
      'A deck we can read on our own time',
      'Live on a call, walked through',
      'Both — send it ahead, then talk',
    ],
  },
  {
    id: 'who_else',
    label: 'Anyone else who should be included or copied?',
    type: 'longtext',
    section: 'working',
    help: 'Your builder and architect are already on our list. Family, a friend whose opinion you trust, anyone else?',
  },

  // ---- Money --------------------------------------------------------------
  {
    id: 'spend_vs_save',
    label: 'Where should the money show, and where does it genuinely not matter?',
    type: 'longtext',
    section: 'budget',
    help: 'Be blunt. This single answer saves more back-and-forth than anything else on this form.',
  },
  {
    id: 'allowances',
    label: 'Any allowances your builder has already set?',
    type: 'longtext',
    section: 'budget',
    help: 'If there are numbers we should be designing inside of, we would rather have them now than design past them.',
  },
  {
    id: 'regret_underspending',
    label: 'What would you regret underspending on?',
    type: 'longtext',
    section: 'budget',
  },
  {
    id: 'waste_of_money',
    label: 'What is a waste of money no matter how good it looks?',
    type: 'longtext',
    section: 'budget',
  },

  // ---- Last Four ----------------------------------------------------------
  {
    id: 'first_feeling',
    label: 'A year from now you walk in the front door. What is the first thing you want to feel?',
    type: 'longtext',
    section: 'gutcheck',
  },
  {
    id: 'copy_top_to_bottom',
    label: 'Name a house, hotel, or restaurant you would copy top to bottom',
    type: 'longtext',
    section: 'gutcheck',
  },
  {
    id: 'not_us',
    label: 'What would make you walk in and think "this isn\'t us"?',
    type: 'longtext',
    section: 'gutcheck',
  },
  {
    id: 'most_upset',
    label: 'What is the one thing you will be most upset about if we get it wrong?',
    type: 'longtext',
    section: 'gutcheck',
    help: 'Everyone has one. Naming it is the cheapest insurance on this whole project.',
  },
]

const schema = makeSchema({
  id: 'newbuild',
  title: 'New construction — part one',
  intro:
    'This is part one, and it is deliberately not about tile and faucets yet — your architect ' +
    'has not drawn the house. What we need first is how you live in it, so Soraia can sit down ' +
    'with him and get the plan right. The finish choices come later, once there is something to ' +
    'put them on. Only three things here are required: your names, the address, and some ' +
    'inspiration photos. Everything else, skip anything you are unsure about — and your answers ' +
    'save as you go, so you can put it down and come back on the same device.',
  doneMessage:
    'That is what Soraia needs before she sits down with your architect. Part two — tile, ' +
    'finishes, fixtures, all of it — comes once there are drawings to put them on. If anything ' +
    'changes in the meantime, reopen your link and submit again. It updates rather than duplicates.',
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
