// Unit tests for the intake question schema: normalization, the required set, and
// conditional questions. Pure logic — no network — so it runs with plain `node`.
// Run: node api/_lib/intake-questions.test.mjs
import assert from 'node:assert'

const {
  QUESTIONS,
  QUESTIONS_BY_ID,
  REQUIRED_IDS,
  UPLOAD_QUESTIONS,
  SECTIONS,
  formatAnswer,
  isQuestionActive,
  normalizeAnswer,
  normalizeAnswers,
  validateAnswers,
} = await import('./intake-questions.js')

let passed = 0
const t = (name, fn) => {
  fn()
  passed += 1
  console.log(`  ✓ ${name}`)
}

const q = (id) => QUESTIONS_BY_ID.get(id)

// --- schema integrity ------------------------------------------------------
t('question ids are unique', () => {
  const ids = QUESTIONS.map((x) => x.id)
  assert.equal(new Set(ids).size, ids.length)
})

t('labels are unique — the Sheet addresses columns by label', () => {
  const labels = QUESTIONS.map((x) => x.label)
  assert.equal(new Set(labels).size, labels.length, 'duplicate label would collide in buildRowMap')
})

t('every question belongs to a declared section', () => {
  const known = new Set(SECTIONS.map((s) => s.id))
  for (const x of QUESTIONS) assert.ok(known.has(x.section), `${x.id} has unknown section ${x.section}`)
})

t('the required set is exactly the four Abe settled on', () => {
  assert.deepEqual(REQUIRED_IDS.sort(), [
    'full_name',
    'inspiration_files',
    'property_address',
    'total_furnishings_budget',
  ])
})

t('all 39 ported Notion questions are present, plus the new floor plans one', () => {
  const ported = QUESTIONS.filter((x) => x.notion)
  assert.equal(ported.length, 39)
  assert.equal(QUESTIONS.length, 40)
  assert.equal(q('floor_plans').notion, null)
})

t('upload questions map to real Drive routes', () => {
  assert.deepEqual(
    UPLOAD_QUESTIONS.map((x) => x.uploadKind).sort(),
    ['floor_plans', 'inspiration', 'property_photos'],
  )
})

// --- normalization ---------------------------------------------------------
t('blank and whitespace answers normalize to null', () => {
  assert.equal(normalizeAnswer(q('colors_you_love'), ''), null)
  assert.equal(normalizeAnswer(q('colors_you_love'), '   '), null)
  assert.equal(normalizeAnswer(q('colors_you_love'), undefined), null)
  assert.equal(normalizeAnswer(q('colors_you_love'), null), null)
})

t('a real zero survives — blankness is tested on the string, not falsiness', () => {
  assert.equal(normalizeAnswer(q('bedrooms'), 0), 0)
  assert.equal(normalizeAnswer(q('bedrooms'), '0'), 0)
})

t('numbers tolerate the commas clients actually type', () => {
  assert.equal(normalizeAnswer(q('square_footage'), '2,400'), 2400)
  assert.equal(normalizeAnswer(q('square_footage'), 'about a lot'), null)
})

t('select answers outside the option list are rejected, not stored', () => {
  assert.equal(normalizeAnswer(q('renovation_timeline'), 'Locked'), 'Locked')
  assert.equal(normalizeAnswer(q('renovation_timeline'), 'Whenever'), null)
})

t('multiselect drops unknown options and empties to null', () => {
  assert.deepEqual(normalizeAnswer(q('style_categories'), ['Coastal', 'Nope', 'Boho']), ['Coastal', 'Boho'])
  assert.equal(normalizeAnswer(q('style_categories'), ['Nope']), null)
})

t('files normalize to {name,id,url} and derive a Drive url from an id', () => {
  const out = normalizeAnswer(q('inspiration_files'), [{ name: 'kitchen.jpg', id: 'FILE1' }])
  assert.deepEqual(out, [
    { name: 'kitchen.jpg', id: 'FILE1', url: 'https://drive.google.com/file/d/FILE1/view' },
  ])
})

t('files with no usable name are dropped', () => {
  assert.equal(normalizeAnswer(q('inspiration_files'), [{ id: 'X' }, { name: '  ' }]), null)
  assert.equal(normalizeAnswer(q('inspiration_files'), 'not-an-array'), null)
})

t('normalizeAnswers drops unknown keys', () => {
  const out = normalizeAnswers({ full_name: 'Kate', injected_column: 'x' })
  assert.deepEqual(Object.keys(out), ['full_name'])
})

// --- validation ------------------------------------------------------------
const complete = {
  full_name: 'Dhruvika Patel',
  property_address: '4819 Ocean Blvd, Destin',
  total_furnishings_budget: '$85,000',
  inspiration_files: [{ name: 'living-room.jpg', id: 'A1' }],
}

t('a complete submission validates', () => {
  const r = validateAnswers(complete)
  assert.equal(r.ok, true)
  assert.equal(r.answers.full_name, 'Dhruvika Patel')
})

t('missing inspiration photos is a validation failure — the whole point of the rebuild', () => {
  const { inspiration_files: _omitted, ...rest } = complete
  const r = validateAnswers(rest)
  assert.equal(r.ok, false)
  assert.deepEqual(r.missing.map((m) => m.id), ['inspiration_files'])
})

t('an empty file array does not satisfy the requirement', () => {
  const r = validateAnswers({ ...complete, inspiration_files: [] })
  assert.equal(r.ok, false)
  assert.deepEqual(r.missing.map((m) => m.id), ['inspiration_files'])
})

t('all four missing are all four reported, in form order', () => {
  const r = validateAnswers({})
  assert.equal(r.ok, false)
  assert.deepEqual(r.missing.map((m) => m.id), [
    'full_name',
    'property_address',
    'total_furnishings_budget',
    'inspiration_files',
  ])
})

// --- conditional questions -------------------------------------------------
t('the mural follow-up is inactive unless murals are a Yes', () => {
  assert.equal(isQuestionActive(q('mural_property_name'), { murals: 'Yes' }), true)
  assert.equal(isQuestionActive(q('mural_property_name'), { murals: 'No' }), false)
  assert.equal(isQuestionActive(q('mural_property_name'), {}), false)
})

t('unconditional questions are always active', () => {
  assert.equal(isQuestionActive(q('full_name'), {}), true)
})

// --- formatting ------------------------------------------------------------
t('formatAnswer flattens files and multiselects for the Sheet', () => {
  assert.equal(formatAnswer(q('inspiration_files'), [{ name: 'a.jpg' }, { name: 'b.jpg' }]), 'a.jpg, b.jpg')
  assert.equal(formatAnswer(q('style_categories'), ['Coastal', 'Boho']), 'Coastal, Boho')
  assert.equal(formatAnswer(q('bedrooms'), 0), '0')
  assert.equal(formatAnswer(q('colors_you_love'), null), '')
})

console.log(`ALL ${passed} PASS`)
