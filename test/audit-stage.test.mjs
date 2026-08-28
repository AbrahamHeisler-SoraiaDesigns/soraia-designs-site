import test from 'node:test'
import assert from 'node:assert/strict'

import {
  AUDIT_SUBMITTED_DEAL_STAGE_ID,
  NEW_LEAD_DEAL_STAGE_ID,
  findEngagedDeal,
} from '../api/_lib/audit-config.js'

// Mirrors nurture.js's NON_ENGAGING_DEAL_STAGES with the env var unset (the state
// of a local run and of any deploy where the var drifted away).
const NON_ENGAGING = [NEW_LEAD_DEAL_STAGE_ID, AUDIT_SUBMITTED_DEAL_STAGE_ID]

test('Audit Submitted is not engagement — the nurture ladder keeps running', () => {
  const deals = [{ id: '1', dealstage: AUDIT_SUBMITTED_DEAL_STAGE_ID }]
  assert.equal(findEngagedDeal(deals, NON_ENGAGING), null)
})

test('New Lead is still not engagement after the audit has been delivered', () => {
  const deals = [{ id: '1', dealstage: NEW_LEAD_DEAL_STAGE_ID }]
  assert.equal(findEngagedDeal(deals, NON_ENGAGING), null)
})

test('a human moving the deal forward still stops the ladder', () => {
  const deals = [{ id: '1', dealstage: 'appointmentscheduled' }]
  assert.equal(findEngagedDeal(deals, NON_ENGAGING)?.id, '1')
})

test('the two stages are distinct ids', () => {
  assert.notEqual(AUDIT_SUBMITTED_DEAL_STAGE_ID, NEW_LEAD_DEAL_STAGE_ID)
})
