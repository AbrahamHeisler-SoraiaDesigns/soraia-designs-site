// Unit tests for the master-Sheet row mapping. Pure — no Sheets calls.
// Run: node api/_lib/intake-sheet.test.mjs
import assert from 'node:assert'

const { META_COLUMNS, buildRowMap, columnLetter, expectedHeaders } = await import('./intake-sheet.js')
const { QUESTIONS, normalizeAnswers } = await import('./intake-questions.js')

let passed = 0
const t = (name, fn) => {
  fn()
  passed += 1
  console.log(`  ✓ ${name}`)
}

// --- A1 column addressing --------------------------------------------------
// The table is ~45 columns wide, so it runs past Z. Getting this wrong writes
// every answer into the wrong column.
t('column letters cross the Z boundary correctly', () => {
  assert.equal(columnLetter(0), 'A')
  assert.equal(columnLetter(25), 'Z')
  assert.equal(columnLetter(26), 'AA')
  assert.equal(columnLetter(27), 'AB')
  assert.equal(columnLetter(51), 'AZ')
  assert.equal(columnLetter(52), 'BA')
})

t('the real table is wider than one letter', () => {
  const headers = expectedHeaders()
  assert.ok(headers.length > 26, `expected >26 columns, got ${headers.length}`)
  assert.equal(headers.length, META_COLUMNS.length + QUESTIONS.length)
})

t('meta columns lead, and Deal ID is present as the row identity', () => {
  const headers = expectedHeaders()
  assert.deepEqual(headers.slice(0, META_COLUMNS.length), META_COLUMNS)
  assert.ok(headers.includes('Deal ID'))
})

t('header text is unique — duplicates would silently overwrite each other', () => {
  const headers = expectedHeaders()
  assert.equal(new Set(headers).size, headers.length)
})

// --- row mapping -----------------------------------------------------------
const input = {
  submittedAt: '2026-08-05T02:00:00.000Z',
  dealId: 'DEAL123',
  clientName: 'Dhruvika Patel',
  briefUrl: 'https://docs.google.com/document/d/DOC1/edit',
  folderUrl: 'https://drive.google.com/drive/folders/FOLDER1',
  answers: normalizeAnswers({
    full_name: 'Dhruvika Patel',
    property_address: '4819 Ocean Blvd, Destin',
    total_furnishings_budget: '$85,000',
    bedrooms: 4,
    style_categories: ['Coastal', 'Modern'],
    inspiration_files: [{ name: 'a.jpg', id: 'F1' }, { name: 'b.jpg', id: 'F2' }],
  }),
}

t('meta values land in their columns', () => {
  const row = buildRowMap(input)
  assert.equal(row['Deal ID'], 'DEAL123')
  assert.equal(row['Client Name'], 'Dhruvika Patel')
  assert.equal(row['Submitted At'], '2026-08-05T02:00:00.000Z')
  assert.equal(row['Design Brief'], 'https://docs.google.com/document/d/DOC1/edit')
  assert.equal(row['Client Folder'], 'https://drive.google.com/drive/folders/FOLDER1')
})

t('every question gets a key, answered or not', () => {
  const row = buildRowMap(input)
  for (const q of QUESTIONS) assert.ok(q.label in row, `missing column for ${q.id}`)
})

t('unanswered questions are empty strings, never undefined', () => {
  const row = buildRowMap(input)
  assert.equal(row['Colors you love'], '')
  assert.ok(Object.values(row).every((v) => typeof v === 'string'))
})

t('lists flatten to comma-joined text', () => {
  const row = buildRowMap(input)
  assert.equal(row['Style categories'], 'Coastal, Modern')
  assert.equal(row['Inspiration photos'], 'a.jpg, b.jpg')
})

t('a numeric zero is written as "0", not blank', () => {
  const row = buildRowMap({ ...input, answers: normalizeAnswers({ bedrooms: 0 }) })
  assert.equal(row.Bedrooms, '0')
})

t('missing meta fields degrade to empty strings rather than "undefined"', () => {
  const row = buildRowMap({ answers: {} })
  assert.equal(row['Deal ID'], '')
  assert.equal(row['Design Brief'], '')
})

console.log(`ALL ${passed} PASS`)
