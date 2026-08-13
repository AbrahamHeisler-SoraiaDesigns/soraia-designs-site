// Unit tests for the new-construction schema and the shared engine underneath it.
// Pure logic — no network — so it runs with plain `node`.
// Run: node api/_lib/intake-questions-newbuild.test.mjs
import assert from 'node:assert'

const newbuild = (await import('./intake-questions-newbuild.js')).default
const str = (await import('./intake-questions.js')).default
const { CHANGED_PREFIX, CONFIRMED_VALUE, isCorrection, makeSchema } = await import('./intake-schema.js')
const { getForm, formKinds, isKnownForm } = await import('./intake-forms.js')
const { buildRowMap, expectedHeaders, META_COLUMNS } = await import('./intake-sheet.js')
const { renderBriefHtml } = await import('./intake-brief.js')

let passed = 0
const t = (name, fn) => {
  fn()
  passed += 1
  console.log(`  ✓ ${name}`)
}

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

t('every upload question routes somewhere real', async () => {
  const { isValidUploadKind } = await import('./intake-drive.js')
  for (const question of newbuild.UPLOAD_QUESTIONS) {
    assert.ok(isValidUploadKind(question.uploadKind), `${question.id} -> ${question.uploadKind}`)
  }
})

// --- the form has to stay reusable -----------------------------------------
t('the form stays short', () => {
  // v1 grew to 79 questions and Soraia cut it to 23. Forms regrow one reasonable
  // addition at a time, so the ceiling is a test rather than a good intention.
  // If a question does not change a layout, a budget, or a shortlist, it belongs
  // in a call. Raising this number should be a decision, not a side effect.
  assert.ok(newbuild.QUESTIONS.length <= 25, `form has grown to ${newbuild.QUESTIONS.length} questions`)
})

t('no question is tailored to one client', () => {
  // v1 quoted a specific discovery call back at the client, which read as awkward
  // and made the form unusable for anyone else. `call` is the field that did it.
  const tailored = newbuild.QUESTIONS.filter((q) => q.call || q.type === 'confirm')
  assert.deepEqual(tailored.map((q) => q.id), [])
})

t('no client names or properties leak into the copy', () => {
  // Specific tokens that appeared in v1. A blunt guard, but this exact leak has
  // happened once already and it reaches the client.
  const banned = ['dickman', 'rachel', 'sam ', 'davis', 'snell isle', 'parker', 'bosch', 'soraia designs']
  const offenders = []
  const scan = (where, text) => {
    if (typeof text !== 'string') return
    const lower = text.toLowerCase()
    for (const b of banned) if (lower.includes(b)) offenders.push(`${where}: ${b}`)
  }
  scan('intro', newbuild.intro)
  scan('doneMessage', newbuild.doneMessage)
  for (const s of newbuild.SECTIONS) {
    scan(`section.title:${s.id}`, s.title)
    scan(`section.blurb:${s.id}`, s.blurb)
  }
  for (const q of newbuild.QUESTIONS) {
    scan(`label:${q.id}`, q.label)
    scan(`help:${q.id}`, q.help)
    for (const o of q.options || []) scan(`option:${q.id}`, o)
  }
  assert.deepEqual(offenders, [])
})

t('no em or en dashes in anything the client reads', () => {
  // Standing house rule for Soraia-facing copy. Worth a test rather than a comment:
  // an em dash is the most natural thing in the world to type mid-sentence and
  // nothing downstream complains.
  const offenders = []
  const scan = (where, text) => {
    if (typeof text === 'string' && /[—–]/.test(text)) offenders.push(`${where}: ${text.slice(0, 60)}`)
  }
  scan('intro', newbuild.intro)
  scan('doneMessage', newbuild.doneMessage)
  for (const s of newbuild.SECTIONS) {
    scan(`section.title:${s.id}`, s.title)
    scan(`section.blurb:${s.id}`, s.blurb)
  }
  for (const q of newbuild.QUESTIONS) {
    scan(`label:${q.id}`, q.label)
    scan(`help:${q.id}`, q.help)
    for (const o of q.options || []) scan(`option:${q.id}`, o)
  }
  assert.deepEqual(offenders, [])
})

t('the STR form holds to the same dash rule', () => {
  const offenders = []
  const scan = (text) => {
    if (typeof text === 'string' && /[—–]/.test(text)) offenders.push(text.slice(0, 60))
  }
  scan(str.intro)
  scan(str.doneMessage)
  for (const s of str.SECTIONS) { scan(s.title); scan(s.blurb) }
  for (const q of str.QUESTIONS) {
    scan(q.label)
    scan(q.help)
    for (const o of q.options || []) scan(o)
  }
  assert.deepEqual(offenders, [])
})

t('exactly three questions are required, and they are the three we promise', () => {
  // The intro copy tells the client "only three are required". If that number and
  // this list drift, the form lies to them on the first screen.
  assert.deepEqual(newbuild.REQUIRED_IDS, ['full_name', 'project_address', 'inspiration_files'])
  assert.match(newbuild.intro, /three are required/)
})

// --- validation ------------------------------------------------------------
t('a minimal valid submission passes', () => {
  const res = newbuild.validateAnswers({
    full_name: 'A Client',
    project_address: '1 Example Dr',
    inspiration_files: [{ name: 'bath.jpg', id: 'file123' }],
  })
  assert.equal(res.ok, true)
})

t('inspiration photos with no Drive id do not satisfy the requirement', () => {
  const res = newbuild.validateAnswers({
    full_name: 'A Client',
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

t('multiselect shower features drop anything not on the list', () => {
  const res = newbuild.validateAnswers({
    full_name: 'A',
    project_address: 'B',
    inspiration_files: [{ name: 'x.jpg', id: 'i1' }],
    shower_features: ['Steam', 'Gold taps everywhere'],
  })
  assert.deepEqual(res.answers.shower_features, ['Steam'])
})

// --- the confirm type ------------------------------------------------------
// No shipped form uses `confirm` any more: v1's tailored questions were the only
// consumer and Soraia cut them. The type stays in the engine because the pattern
// (show what we already believe, one tap to agree, corrections lead the brief) is
// sound for a future per-client addendum. Tested against a synthetic schema so the
// coverage does not depend on a production form happening to use it.
const confirmFixture = makeSchema({
  id: 'test_confirm',
  title: 'confirm fixture',
  sections: [{ id: 'only', title: 'Only', blurb: '' }],
  questions: [
    { id: 'a_claim', label: 'A claim', type: 'confirm', section: 'only', call: 'We believe X.' },
  ],
})
const cq = confirmFixture.QUESTIONS_BY_ID.get('a_claim')

t('a confirmation normalizes to the sentinel and is not a correction', () => {
  const v = confirmFixture.normalizeAnswer(cq, CONFIRMED_VALUE)
  assert.equal(v, CONFIRMED_VALUE)
  assert.equal(isCorrection(v), false)
})

t('a correction survives normalization and is detected', () => {
  const raw = `${CHANGED_PREFIX}actually it is Y`
  assert.equal(confirmFixture.normalizeAnswer(cq, raw), raw)
  assert.equal(isCorrection(raw), true)
})

t('a correction with no detail still records the disagreement', () => {
  // "Not quite" with an empty note must not normalize away: a client who taps
  // disagree and does not elaborate has still told us we are wrong. The trailing
  // space in CHANGED_PREFIX gets trimmed, which is why isCorrection compares
  // against the trimmed prefix.
  const v = confirmFixture.normalizeAnswer(cq, CHANGED_PREFIX)
  assert.ok(v, 'an empty correction was dropped')
  assert.equal(isCorrection(v), true)
})

t('an untouched confirm is simply unanswered', () => {
  assert.equal(confirmFixture.normalizeAnswer(cq, ''), null)
})

t('the brief leads with what the client corrected', () => {
  const html = renderBriefHtml({
    schema: confirmFixture,
    clientName: 'A Client',
    submittedAt: '2026-08-13T00:00:00Z',
    answers: { a_claim: `${CHANGED_PREFIX}actually it is Y` },
  })
  assert.match(html, /They corrected us on these/)
  assert.match(html, /actually it is Y/)
})

t('a brief with no corrections has no corrections banner', () => {
  const html = renderBriefHtml({
    schema: confirmFixture,
    clientName: 'A Client',
    submittedAt: '2026-08-13T00:00:00Z',
    answers: { a_claim: CONFIRMED_VALUE },
  })
  assert.doesNotMatch(html, /corrected us/)
})

t('a confirmed answer carries its claim into the brief', () => {
  // "Confirmed" alone is unreadable six weeks later.
  const html = renderBriefHtml({
    schema: confirmFixture,
    clientName: 'X',
    submittedAt: 'now',
    answers: { a_claim: CONFIRMED_VALUE },
  })
  assert.match(html, /We believe X/)
})

// --- the form registry -----------------------------------------------------
t('both forms resolve and carry distinct schemas', () => {
  assert.equal(getForm('str').schema.id, 'str')
  assert.equal(getForm('newbuild').schema.id, 'newbuild')
  assert.deepEqual(formKinds().sort(), ['newbuild', 'str'])
})

t('the two forms write to different sheet tabs', () => {
  assert.notEqual(getForm('str').sheetTab, getForm('newbuild').sheetTab)
})

t('an unknown form falls back to STR rather than throwing', () => {
  assert.equal(isKnownForm('nope'), false)
  assert.equal(getForm('nope').schema.id, 'str')
  assert.equal(getForm(undefined).schema.id, 'str')
})

t('the STR schema is untouched by any of this', () => {
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
    clientName: 'A Client',
    answers: { full_name: 'A Client', shower_features: ['Steam', 'Rain head overhead'] },
  })
  assert.equal(row['Deal ID'], '342184638192')
  assert.equal(row['Your names'], 'A Client')
  assert.equal(row['In the shower, which of these are real for you?'], 'Steam, Rain head overhead')
})

t('the brief renders the real form end to end', () => {
  const html = renderBriefHtml({
    schema: newbuild,
    clientName: 'A Client',
    propertyAddress: '1 Example Dr',
    submittedAt: '2026-08-13T00:00:00Z',
    answers: { full_name: 'A Client', current_home_gripes: 'The pantry is behind the fridge door.' },
  })
  assert.match(html, /How You Live/)
  assert.match(html, /pantry is behind the fridge door/)
  assert.match(html, /Left blank/)
})

console.log(`\nALL ${passed} PASS`)
