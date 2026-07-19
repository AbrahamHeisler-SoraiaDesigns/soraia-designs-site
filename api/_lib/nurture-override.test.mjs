// Unit tests for resolveEmailContent — the bespoke-override precedence that folds
// Cody's audit-delivery copy onto the instrumented Gmail path (2026-07-19).
// Pure logic only — no HubSpot/Gmail calls — so it runs with plain `node`.
// Run: node api/_lib/nurture-override.test.mjs
import assert from 'node:assert'
import { resolveEmailContent } from './nurture.js'
import { EMAIL_KEYS } from './audit-config.js'

const contact = {
  firstname: 'Sabrina',
  email: 'sabrina@example.com',
  audit_property_street: '43 Edwards Village Loop',
  audit_property_city: 'West Dover',
  audit_property_state: 'VT',
  audit_pdf_url: 'https://celest-yarrow-s8vk.here.now/',
}

let passed = 0
const t = (name, fn) => {
  fn()
  passed += 1
  console.log(`  ✓ ${name}`)
}

t('full override → bespoke copy wins, source=override', () => {
  const r = resolveEmailContent(EMAIL_KEYS.EMAIL_2, contact, { subject: 'Your West Dover audit is ready', text: 'Hi Sabrina, ...' })
  assert.strictEqual(r.subject, 'Your West Dover audit is ready')
  assert.strictEqual(r.text, 'Hi Sabrina, ...')
  assert.strictEqual(r.source, 'override')
})

t('no override → template email_2, source=template', () => {
  const r = resolveEmailContent(EMAIL_KEYS.EMAIL_2, contact, null)
  assert.strictEqual(r.source, 'template')
  assert.ok(/43 Edwards Village Loop/.test(r.subject), 'template subject names the street')
  assert.ok(r.text.length > 0 && !/<[a-z]/i.test(r.text), 'template text is plain (no HTML tags)')
})

t('half-filled override (subject only) → falls back to template, not a blank body', () => {
  const r = resolveEmailContent(EMAIL_KEYS.EMAIL_2, contact, { subject: 'only a subject' })
  assert.strictEqual(r.source, 'template')
  assert.ok(r.text.length > 0)
})

t('half-filled override (text only) → falls back to template', () => {
  const r = resolveEmailContent(EMAIL_KEYS.EMAIL_2, contact, { text: 'only a body' })
  assert.strictEqual(r.source, 'template')
})

t('empty-string fields in override → falls back (guards against blank send)', () => {
  const r = resolveEmailContent(EMAIL_KEYS.EMAIL_2, contact, { subject: '', text: '' })
  assert.strictEqual(r.source, 'template')
})

console.log(`\nALL ${passed} PASS`)
