// Unit tests for the delivery-vs-nurture split (2026-08-04).
//
// Regression cover for the bug that left Angela Petri's audit undelivered for eight
// weeks: the reply gate wrote audit_nurture_status='paused_reply', which is terminal,
// so nextEmailKey() returned null forever and no path could ever send her audit —
// while audit_status read 'delivered' because the flip ran before the send.
//
// Pure logic only — no HubSpot/Gmail calls — so it runs with plain `node`.
// Run: node api/_lib/nurture-delivery-gate.test.mjs
import assert from 'node:assert'
import { deliveryIsBlocked, nextEmailKey, resolveNextNurtureStatus } from './nurture.js'
import { EMAIL_KEYS } from './audit-config.js'

let passed = 0
const t = (name, fn) => {
  fn()
  passed += 1
  console.log(`  ✓ ${name}`)
}

// ---------------------------------------------------------------------------
// deliveryIsBlocked — what may actually stop the audit itself going out
// ---------------------------------------------------------------------------

t('a lead who replied is NOT blocked from receiving their audit', () => {
  assert.strictEqual(deliveryIsBlocked({ audit_nurture_status: 'paused_reply' }).blocked, false)
})
t('a lead who booked a call is NOT blocked', () => {
  assert.strictEqual(deliveryIsBlocked({ audit_nurture_status: 'paused_booked' }).blocked, false)
})
t('a manually paused lead is NOT blocked (the human is the one sending)', () => {
  assert.strictEqual(deliveryIsBlocked({ audit_nurture_status: 'paused_manual' }).blocked, false)
})
t('a completed-ladder lead is NOT blocked', () => {
  assert.strictEqual(deliveryIsBlocked({ audit_nurture_status: 'completed' }).blocked, false)
})
t('a fresh lead is NOT blocked', () => {
  assert.strictEqual(deliveryIsBlocked({}).blocked, false)
})

t('unsubscribed IS blocked', () => {
  const r = deliveryIsBlocked({ audit_nurture_status: 'unsubscribed' })
  assert.strictEqual(r.blocked, true)
  assert.match(r.reason, /opted_out/)
})
t('bounced IS blocked', () => {
  assert.strictEqual(deliveryIsBlocked({ audit_nurture_status: 'bounced' }).blocked, true)
})
t('complained IS blocked', () => {
  assert.strictEqual(deliveryIsBlocked({ audit_nurture_status: 'complained' }).blocked, true)
})
t('a test row IS blocked', () => {
  const r = deliveryIsBlocked({ audit_test: 'true' })
  assert.strictEqual(r.blocked, true)
  assert.strictEqual(r.reason, 'test_contact')
})

// ---------------------------------------------------------------------------
// The Angela Petri shape — proves the old lockout and the new escape hatch
// ---------------------------------------------------------------------------

const angela = {
  email: 'angela.petri1@outlook.com',
  audit_status: 'requested',
  audit_pdf_url: '',
  audit_last_email_key: EMAIL_KEYS.EMAIL_1,
  audit_nurture_status: 'paused_reply',
  hs_lead_status: 'NEW_AUDIT_REQUESTED',
}

t('REGRESSION: the nurture ladder still refuses her (paused_reply is terminal)', () => {
  // This is correct and unchanged — the LADDER should stay off for a lead who replied.
  assert.strictEqual(nextEmailKey(angela), null)
})
t('REGRESSION: ...but delivery is no longer blocked, so the audit can reach her', () => {
  // This is the fix. Before, there was no path at all.
  assert.strictEqual(deliveryIsBlocked(angela).blocked, false)
})
t('REGRESSION: even flipped to delivered, the ladder stays off for a replied lead', () => {
  const flipped = { ...angela, audit_status: 'delivered', audit_pdf_url: 'https://x.here.now/' }
  assert.strictEqual(nextEmailKey(flipped), null)
})

// ---------------------------------------------------------------------------
// resolveNextNurtureStatus — delivering must not silently re-arm the ladder
// ---------------------------------------------------------------------------

t('delivering to a replied lead PRESERVES paused_reply (no Esther collision)', () => {
  assert.strictEqual(
    resolveNextNurtureStatus(EMAIL_KEYS.EMAIL_2, { audit_nurture_status: 'paused_reply' }, true),
    'paused_reply',
  )
})
t('delivering to a booked lead PRESERVES paused_booked', () => {
  assert.strictEqual(
    resolveNextNurtureStatus(EMAIL_KEYS.EMAIL_2, { audit_nurture_status: 'paused_booked' }, true),
    'paused_booked',
  )
})
t('delivering to a normal lead activates the ladder', () => {
  assert.strictEqual(
    resolveNextNurtureStatus(EMAIL_KEYS.EMAIL_2, { audit_nurture_status: 'active' }, true),
    'active',
  )
})
t('delivering to a brand-new lead activates the ladder', () => {
  assert.strictEqual(resolveNextNurtureStatus(EMAIL_KEYS.EMAIL_2, {}, true), 'active')
})
t('a normal nurture send is unaffected by the preserve rule', () => {
  // isDelivery=false → never preserves, matching pre-change behavior.
  assert.strictEqual(
    resolveNextNurtureStatus(EMAIL_KEYS.EMAIL_3, { audit_nurture_status: 'paused_reply' }, false),
    'active',
  )
})
t('recovery_2 still completes the ladder', () => {
  assert.strictEqual(
    resolveNextNurtureStatus(EMAIL_KEYS.RECOVERY_2, { audit_nurture_status: 'active' }, false),
    'completed',
  )
})
t('recovery_2 completes even on a delivery', () => {
  assert.strictEqual(
    resolveNextNurtureStatus(EMAIL_KEYS.RECOVERY_2, { audit_nurture_status: 'paused_reply' }, true),
    'completed',
  )
})

console.log(`\nALL ${passed} PASS`)
