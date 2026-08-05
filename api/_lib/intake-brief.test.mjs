// Unit tests for the design-brief HTML renderer. Pure — no Drive calls.
// Run: node api/_lib/intake-brief.test.mjs
import assert from 'node:assert'

const { briefDocName, renderBriefHtml } = await import('./intake-brief.js')
const { normalizeAnswers } = await import('./intake-questions.js')

let passed = 0
const t = (name, fn) => {
  fn()
  passed += 1
  console.log(`  ✓ ${name}`)
}

const base = {
  clientName: 'Dhruvika Patel',
  dealId: 'DEAL123',
  submittedAt: '2026-08-05T02:00:00.000Z',
}

const render = (raw) =>
  renderBriefHtml({
    ...base,
    propertyAddress: raw.property_address || '',
    answers: normalizeAnswers(raw),
  })

// --- naming ----------------------------------------------------------------
t('doc name uses the em dash the folder template uses', () => {
  assert.equal(briefDocName('Dhruvika Patel'), 'Design Brief — Dhruvika Patel')
})

t('doc name collapses messy whitespace and survives an empty name', () => {
  assert.equal(briefDocName('  Kate   Ladyzhensky '), 'Design Brief — Kate Ladyzhensky')
  assert.equal(briefDocName(''), 'Design Brief — Client')
  assert.equal(briefDocName(null), 'Design Brief — Client')
})

// --- structure -------------------------------------------------------------
t('answered questions appear under their section heading', () => {
  const html = render({ full_name: 'Dhruvika Patel', colors_you_love: 'warm neutrals' })
  assert.ok(html.includes('<h2>Style &amp; Inspiration</h2>'))
  assert.ok(html.includes('<h3>Colors you love</h3>'))
  assert.ok(html.includes('<p>warm neutrals</p>'))
})

t('a section with nothing answered is omitted entirely', () => {
  const html = render({ full_name: 'Dhruvika Patel' })
  assert.ok(!html.includes('<h2>Renovation</h2>'), 'empty section should not print')
})

t('unanswered questions are listed once under "Left blank", not printed empty', () => {
  const html = render({ full_name: 'Dhruvika Patel' })
  assert.ok(html.includes('<h2>Left blank</h2>'))
  assert.ok(html.includes('Colors you love'))
  assert.ok(!html.includes('<h3>Colors you love</h3>'), 'blank answer must not get its own heading')
})

t('a question hidden by its condition is not reported as left blank', () => {
  const html = render({ full_name: 'X', murals: 'No' })
  const blankSection = html.split('<h2>Left blank</h2>')[1] || ''
  assert.ok(!blankSection.includes('add the property name'), 'inactive question should be invisible')
})

t('file answers render as links to Drive', () => {
  const html = render({ inspiration_files: [{ name: 'kitchen.jpg', id: 'F1' }] })
  assert.ok(html.includes('<a href="https://drive.google.com/file/d/F1/view">kitchen.jpg</a>'))
})

t('header carries property, submitted time and deal id', () => {
  const html = render({ property_address: '4819 Ocean Blvd, Destin' })
  assert.ok(html.includes('4819 Ocean Blvd, Destin'))
  assert.ok(html.includes('2026-08-05T02:00:00.000Z'))
  assert.ok(html.includes('DEAL123'))
})

// --- escaping --------------------------------------------------------------
// Client-supplied prose lands in an HTML document. An unescaped angle bracket
// would not just look wrong, it would let a client's text alter the brief.
t('client text is HTML-escaped', () => {
  const html = render({ colors_you_love: '<script>alert(1)</script> & "quotes"' })
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(html.includes('&amp;'))
  assert.ok(html.includes('&quot;'))
})

t('a malicious filename cannot inject markup through the link text', () => {
  const html = render({ inspiration_files: [{ name: '<img src=x onerror=1>', id: 'F1' }] })
  assert.ok(!html.includes('<img src=x'))
  assert.ok(html.includes('&lt;img src=x'))
})

t('line breaks in prose survive as <br/> instead of collapsing', () => {
  const html = render({ target_audience: 'Families\nRemote workers' })
  assert.ok(html.includes('Families<br/>Remote workers'))
})

console.log(`ALL ${passed} PASS`)
