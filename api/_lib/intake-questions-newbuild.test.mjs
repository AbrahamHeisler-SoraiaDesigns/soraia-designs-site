// Unit tests for the new-construction schema and the shared engine underneath it.
// Pure logic — no network — so it runs with plain `node`.
// Run: node api/_lib/intake-questions-newbuild.test.mjs
import assert from 'node:assert'

const newbuild = (await import('./intake-questions-newbuild.js')).default
const str = (await import('./intake-questions.js')).default
const { CHANGED_PREFIX, CONFIRMED_VALUE, isCorrection } = await import('./intake-schema.js')
const { getForm, formKinds, isKnownForm } = await import('./intake-forms.js')
const { buildRowMap, expectedHeaders, META_COLUMNS } = await import('./intake-sheet.js')
const { renderBriefHtml } = await import('./intake-brief.js')

let passed = 0
const t = (name, fn) => {
  fn()
  passed += 1
  console.log(`  ✓ ${name}`)
}

const q = (id) => newbuild.QUESTIONS_BY_ID.get(id)

// --- schema integrity ------------------------------------------------------
t('question ids are unique', () => {
  const ids = newbuild.QUESTIONS.map((x) => x.id)
  assert.equal(new Set(ids).size, ids.length)
})

t('labels are unique — the Sheet addresses columns by label', () => {
  const labels = newbuild.QUESTIONS.map((x) => x.label)
  assert.equal(new Set(labels).size, labels.length, 'duplicate label would collide in buildRowMap')
})

t('no label collides with a meta column', () => {
  for (const label of newbuild.QUESTIONS.map((x) => x.label)) {
    assert.ok(!META_COLUMNS.includes(label), `"${label}" would overwrite a meta column`)
  }
})

t('every question belongs to a declared section', () => {
  const known = new Set(newbuild.SECTIONS.map((s) => s.id))
  for (const question of newbuild.QUESTIONS) {
    assert.ok(known.has(question.section), `${question.id} -> unknown section ${question.section}`)
  }
})

t('every section has at least one question — no empty step in the stepper', () => {
  for (const s of newbuild.SECTIONS) {
    assert.ok(newbuild.questionsForSection(s.id).length > 0, `section ${s.id} is empty`)
  }
})

t('select and multiselect questions declare their options', () => {
  for (const question of newbuild.QUESTIONS) {
    if (question.type === 'select' || question.type === 'multiselect') {
      assert.ok(Array.isArray(question.options) && question.options.length, `${question.id} has no options`)
    }
  }
})

t('every confirm question carries the claim it is confirming', () => {
  // Without `call` the control renders two buttons agreeing to nothing, and the
  // brief records "Confirmed" against a question nobody can reconstruct later.
  for (const question of newbuild.QUESTIONS) {
    if (question.type === 'confirm') {
      assert.ok(question.call, `${question.id} is a confirm with no call text`)
    }
  }
})

t('every upload question routes somewhere real', async () => {
  const { isValidUploadKind } = await import('./intake-drive.js')
  for (const question of newbuild.UPLOAD_QUESTIONS) {
    assert.ok(isValidUploadKind(question.uploadKind), `${question.id} -> ${question.uploadKind}`)
  }
})

t('exactly three questions are required, and they are the three we promise', () => {
  // The intro copy tells the client "three things here are required". If that
  // number and this list drift, the form lies to them on the first screen.
  assert.deepEqual(newbuild.REQUIRED_IDS, ['full_name', 'project_address', 'inspiration_files'])
  assert.match(newbuild.intro, /three things/)
})

t('the never-gold question exists and says never', () => {
  // Load-bearing. Rachel ruled bright brass out on the call; a softened version of
  // this question would put gold back on the table by implication.
  const gold = q('no_gold')
  assert.ok(gold, 'no_gold question is missing')
  assert.match(gold.call, /No gold/)
  assert.doesNotMatch(gold.call, /open to/i)
})

// --- the confirm type ------------------------------------------------------
t('a confirmation normalizes to the sentinel and is not a correction', () => {
  const v = newbuild.normalizeAnswer(q('davis_arches'), CONFIRMED_VALUE)
  assert.equal(v, CONFIRMED_VALUE)
  assert.equal(isCorrection(v), false)
})

t('a correction survives normalization and is detected', () => {
  const raw = `${CHANGED_PREFIX}we changed our mind, arches only in the entry`
  const v = newbuild.normalizeAnswer(q('davis_arches'), raw)
  assert.equal(v, raw)
  assert.equal(isCorrection(v), true)
})

t('a correction with no detail still records the disagreement', () => {
  // "Not quite" with an empty note must not normalize away to null — a client who
  // taps disagree and does not elaborate has still told us we are wrong.
  const v = newbuild.normalizeAnswer(q('davis_arches'), CHANGED_PREFIX)
  assert.ok(v, 'an empty correction was dropped')
  assert.equal(isCorrection(v), true)
})

t('an untouched confirm is simply unanswered', () => {
  assert.equal(newbuild.normalizeAnswer(q('davis_arches'), ''), null)
})

// --- validation ------------------------------------------------------------
t('a minimal valid submission passes', () => {
  const res = newbuild.validateAnswers({
    full_name: 'Sam & Rachel Dickman',
    project_address: '1 Example Dr',
    inspiration_files: [{ name: 'bath.jpg', id: 'file123' }],
  })
  assert.equal(res.ok, true)
})

t('inspiration photos with no Drive id do not satisfy the requirement', () => {
  const res = newbuild.validateAnswers({
    full_name: 'Sam & Rachel Dickman',
    project_address: '1 Example Dr',
    inspiration_files: [{ name: 'bath.jpg' }],
  })
  assert.equal(res.ok, false)
  assert.deepEqual(res.missing.map((m) => m.id), ['inspiration_files'])
})

t('all three missing are all three reported, in form order', () => {
  const res = newbuild.validateAnswers({})
  assert.deepEqual(res.missing.map((m) => m.id), ['full_name', 'project_address', 'inspiration_files'])
})

t('answers from the other form are dropped, not stored', () => {
  const res = newbuild.validateAnswers({
    full_name: 'A',
    project_address: 'B',
    inspiration_files: [{ name: 'x.jpg', id: 'i1' }],
    guest_count_goal: 12,
    adr_goal: '$400',
  })
  assert.equal(res.ok, true)
  assert.equal('guest_count_goal' in res.answers, false)
  assert.equal('adr_goal' in res.answers, false)
})

// --- the form registry -----------------------------------------------------
t('both forms resolve and carry distinct schemas', () => {
  assert.equal(getForm('str').schema.id, 'str')
  assert.equal(getForm('newbuild').schema.id, 'newbuild')
  assert.deepEqual(formKinds().sort(), ['newbuild', 'str'])
})

t('the two forms write to different sheet tabs', () => {
  // Same tab would make a ~130-column table two-thirds empty on every row.
  assert.notEqual(getForm('str').sheetTab, getForm('newbuild').sheetTab)
})

t('an unknown form falls back to STR rather than throwing', () => {
  // A submission we already authorised must never be lost to a typo'd route.
  assert.equal(isKnownForm('nope'), false)
  assert.equal(getForm('nope').schema.id, 'str')
  assert.equal(getForm(undefined).schema.id, 'str')
})

t('the STR schema still behaves exactly as before the engine was extracted', () => {
  assert.deepEqual(str.REQUIRED_IDS, [
    'full_name',
    'property_address',
    'total_furnishings_budget',
    'inspiration_files',
  ])
})

// --- sheet + brief consume the schema they are handed ----------------------
t('sheet headers follow the schema passed in, not the STR default', () => {
  const headers = expectedHeaders(newbuild)
  assert.deepEqual(headers.slice(0, META_COLUMNS.length), META_COLUMNS)
  assert.ok(headers.includes('Your names'))
  assert.ok(!headers.includes('Guest count goal'), 'STR columns leaked into the new-construction tab')
})

t('buildRowMap uses the given schema', () => {
  const row = buildRowMap({
    schema: newbuild,
    submittedAt: '2026-08-13T00:00:00Z',
    dealId: '342184638192',
    clientName: 'Sam & Rachel Dickman',
    answers: { full_name: 'Sam & Rachel Dickman', davis_arches: CONFIRMED_VALUE },
  })
  assert.equal(row['Deal ID'], '342184638192')
  assert.equal(row['Your names'], 'Sam & Rachel Dickman')
  assert.equal(row.Arches, CONFIRMED_VALUE)
})

t('the brief leads with what the client corrected', () => {
  // The whole point of the confirm type. A correction buried under twelve
  // headings becomes a design decision built on a fact already denied.
  const html = renderBriefHtml({
    schema: newbuild,
    clientName: 'Sam & Rachel Dickman',
    submittedAt: '2026-08-13T00:00:00Z',
    answers: {
      davis_arches: CONFIRMED_VALUE,
      no_gold: `${CHANGED_PREFIX}aged brass is fine, just not bright`,
    },
  })
  assert.match(html, /They corrected us on these/)
  assert.match(html, /aged brass is fine/)
  // The agreement is recorded, but not in the corrections list.
  const beforeHr = html.slice(0, html.indexOf('<hr/>', html.indexOf('corrected us')))
  assert.doesNotMatch(beforeHr, /Arches<\/strong>/)
})

t('a brief with no corrections has no corrections banner', () => {
  const html = renderBriefHtml({
    schema: newbuild,
    clientName: 'Sam & Rachel Dickman',
    submittedAt: '2026-08-13T00:00:00Z',
    answers: { davis_arches: CONFIRMED_VALUE },
  })
  assert.doesNotMatch(html, /corrected us/)
})

t('a confirmed answer carries its claim into the brief', () => {
  // "Confirmed" alone is unreadable six weeks later.
  const html = renderBriefHtml({
    schema: newbuild,
    clientName: 'X',
    submittedAt: 'now',
    answers: { davis_waterfall: CONFIRMED_VALUE },
  })
  assert.match(html, /You liked the waterfall edge/)
})

console.log(`\nALL ${passed} PASS`)
