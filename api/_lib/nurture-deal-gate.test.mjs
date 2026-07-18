// Unit tests for the deal-stage suppression decision (Abe's ask 2026-07-17).
// Pure logic only — no HubSpot calls — so it runs with plain `node`.
// Run: node api/_lib/nurture-deal-gate.test.mjs
import assert from 'node:assert'
import { findEngagedDeal, NEW_LEAD_DEAL_STAGE_ID } from './audit-config.js'

const NEW_LEAD = NEW_LEAD_DEAL_STAGE_ID // '3427549892'
const NOT_A_FIT = '3991559896'
const LONG_TERM_FU = '3425971931'

let passed = 0
const t = (name, fn) => {
  fn()
  passed += 1
  console.log(`  ✓ ${name}`)
}

// Default coupling: env creation-stage == New Lead (the documented prod state).
const nonEngaging = [NEW_LEAD, NEW_LEAD]

t('no deals → not suppressed', () => {
  assert.strictEqual(findEngagedDeal([], nonEngaging), null)
})
t('one deal in New Lead → not suppressed', () => {
  assert.strictEqual(findEngagedDeal([{ dealstage: NEW_LEAD }], nonEngaging), null)
})
t('deal moved to Not a Fit → suppressed', () => {
  assert.ok(findEngagedDeal([{ dealstage: NOT_A_FIT }], nonEngaging))
})
t('deal moved to Long Term FU → suppressed', () => {
  assert.ok(findEngagedDeal([{ dealstage: LONG_TERM_FU }], nonEngaging))
})
t('audit deal in New Lead + Full Service deal in another pipeline → suppressed (safe direction)', () => {
  assert.ok(findEngagedDeal([{ dealstage: NEW_LEAD }, { dealstage: 'someOtherPipelineStage' }], nonEngaging))
})
t('empty/missing dealstage is ignored (read anomaly, not engagement)', () => {
  assert.strictEqual(findEngagedDeal([{ dealstage: '' }, { dealstage: undefined }], nonEngaging), null)
})

// M1 regression: env creation-stage drifted away from the hardcoded New Lead id.
// A fresh "- Audit" deal created in the (drifted) creation stage must NOT be
// treated as engaged, or the whole ladder past EMAIL_1 stalls for every lead.
t('M1: fresh deal in a drifted creation stage is NOT suppressed when that stage is coupled', () => {
  const DRIFTED_CREATE_STAGE = '9999999999'
  const coupled = [NEW_LEAD, DRIFTED_CREATE_STAGE]
  assert.strictEqual(findEngagedDeal([{ dealstage: DRIFTED_CREATE_STAGE }], coupled), null)
  // ...but a genuinely engaged stage still suppresses.
  assert.ok(findEngagedDeal([{ dealstage: NOT_A_FIT }], coupled))
})

console.log(`\nALL ${passed} PASS`)
