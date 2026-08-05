// Dated re-engagement gating. Pure decisions only — no network, no HubSpot.
//   node --test test/
//
// The cases that matter here are the ones where a wrong answer mails somebody who
// should never have been mailed. Those are marked below.

import test from 'node:test'
import assert from 'node:assert/strict'

import { EMAIL_KEYS, reengageHoldActive, reengageIsDue } from '../api/_lib/audit-config.js'
import { isReengageRelease, nextEmailKey, resolveNextNurtureStatus } from '../api/_lib/nurture.js'

const DAY = 86_400_000
const future = () => new Date(Date.now() + 14 * DAY).toISOString()
const past = () => new Date(Date.now() - 2 * DAY).toISOString()

// A lead who was parked: audit delivered, human paused them, date set.
const parked = (over = {}) => ({
  email: 'lead@example.com',
  audit_status: 'delivered',
  audit_pdf_url: 'https://example.com/a.pdf',
  audit_nurture_status: 'paused_booked',
  audit_last_email_key: EMAIL_KEYS.EMAIL_2,
  audit_last_email_sent_at: new Date(Date.now() - 30 * DAY).toISOString(),
  audit_reengage_after: past(),
  ...over,
})

test('date helpers read future vs past, and treat garbage as unset', () => {
  assert.equal(reengageHoldActive({ audit_reengage_after: future() }), true)
  assert.equal(reengageHoldActive({ audit_reengage_after: past() }), false)
  assert.equal(reengageIsDue({ audit_reengage_after: past() }), true)
  assert.equal(reengageIsDue({ audit_reengage_after: future() }), false)

  for (const bad of ['', null, undefined, 'not a date', 'tomorrow']) {
    assert.equal(reengageHoldActive({ audit_reengage_after: bad }), false, `hold on ${bad}`)
    assert.equal(reengageIsDue({ audit_reengage_after: bad }), false, `due on ${bad}`)
  }
})

test('a future date holds an ACTIVE lead who would otherwise be due a ladder step', () => {
  const active = {
    audit_nurture_status: 'active',
    audit_status: 'delivered',
    audit_pdf_url: 'https://example.com/a.pdf',
    audit_last_email_key: EMAIL_KEYS.EMAIL_2,
    audit_last_email_sent_at: new Date(Date.now() - 10 * DAY).toISOString(),
  }
  assert.equal(nextEmailKey(active), EMAIL_KEYS.EMAIL_3, 'precondition: would send email_3')
  assert.equal(nextEmailKey({ ...active, audit_reengage_after: future() }), null)
})

test('a reached date resumes the normal ladder for an ACTIVE lead — no reengage rung', () => {
  const active = {
    audit_nurture_status: 'active',
    audit_status: 'delivered',
    audit_pdf_url: 'https://example.com/a.pdf',
    audit_last_email_key: EMAIL_KEYS.EMAIL_2,
    audit_last_email_sent_at: new Date(Date.now() - 10 * DAY).toISOString(),
    audit_reengage_after: past(),
  }
  assert.equal(nextEmailKey(active), EMAIL_KEYS.EMAIL_3)
})

test('a reached date releases a SOFT-PAUSED lead onto the one-shot rung', () => {
  assert.equal(isReengageRelease(parked()), true)
  assert.equal(nextEmailKey(parked()), EMAIL_KEYS.REENGAGE_1)

  for (const status of ['paused_reply', 'paused_booked', 'paused_manual', 'completed']) {
    assert.equal(nextEmailKey(parked({ audit_nurture_status: status })), EMAIL_KEYS.REENGAGE_1, status)
  }
})

test('without a date, a soft-paused lead stays locked — the date is the whole trigger', () => {
  assert.equal(nextEmailKey(parked({ audit_reengage_after: '' })), null)
  assert.equal(nextEmailKey(parked({ audit_reengage_after: future() })), null)
})

// The ones that mail someone they shouldn't.
test('NO date releases a hard opt-out', () => {
  for (const status of ['unsubscribed', 'bounced', 'complained', 'unqualified']) {
    assert.equal(isReengageRelease(parked({ audit_nurture_status: status })), false, status)
    assert.equal(nextEmailKey(parked({ audit_nurture_status: status })), null, status)
  }
  for (const lead of ['UNQUALIFIED', 'UNSUBSCRIBED', 'BOUNCED', 'SPAM_COMPLAINT']) {
    assert.equal(nextEmailKey(parked({ hs_lead_status: lead })), null, lead)
  }
})

test('NO date releases a test row', () => {
  assert.equal(isReengageRelease(parked({ audit_test: 'true' })), false)
  assert.equal(nextEmailKey(parked({ audit_test: 'true' })), null)
})

// The inverse of the case above, and the one the first live use got wrong.
// CALL_BOOKED / CALL_COMPLETED / OPEN_DEAL stop the normal ladder, but they are
// exactly what a parked lead looks like — you only park someone you have talked to.
// Blocking on them made the release unreachable for the entire population.
test('a booked/open-deal lead status does NOT block a release — that is who gets parked', () => {
  for (const lead of ['CALL_BOOKED', 'CALL_COMPLETED', 'OPEN_DEAL']) {
    assert.equal(isReengageRelease(parked({ hs_lead_status: lead })), true, lead)
    assert.equal(nextEmailKey(parked({ hs_lead_status: lead })), EMAIL_KEYS.REENGAGE_1, lead)
  }
})

test('those same statuses still block the normal ladder when no date is set', () => {
  for (const lead of ['CALL_BOOKED', 'CALL_COMPLETED', 'OPEN_DEAL']) {
    const active = parked({ hs_lead_status: lead, audit_nurture_status: 'active', audit_reengage_after: '' })
    assert.equal(nextEmailKey(active), null, lead)
  }
})

// Marielis Suarez as the system saw her on 2026-08-05: audit delivered, walked from
// the property, paused_booked, CALL_BOOKED left over from a strategy call weeks back.
test('the first real parked lead resolves to the rung', () => {
  const marielis = {
    email: 'marielis.suarez@gmail.com',
    audit_status: 'delivered',
    audit_pdf_url: 'https://example.com/a.pdf',
    audit_nurture_status: 'paused_booked',
    hs_lead_status: 'CALL_BOOKED',
    audit_last_email_key: EMAIL_KEYS.EMAIL_2,
    audit_reengage_after: '2026-08-17',
  }
  // Explicit clocks throughout — a bare nextEmailKey() here would assert "held" and
  // then quietly start failing once the wall clock passes the date.
  const beforeTheDay = new Date('2026-08-10T12:00:00Z').getTime()
  assert.equal(reengageHoldActive(marielis, beforeTheDay), true, 'held before 2026-08-17')
  assert.equal(reengageIsDue(marielis, beforeTheDay), false)
  // On the date: one check-in, pause preserved.
  const onTheDay = new Date('2026-08-17T12:00:00Z').getTime()
  assert.equal(reengageIsDue(marielis, onTheDay), true)
  assert.equal(reengageHoldActive(marielis, onTheDay), false)
  assert.equal(
    resolveNextNurtureStatus(EMAIL_KEYS.REENGAGE_1, marielis),
    'paused_booked',
    'ladder must not re-arm behind the check-in',
  )
})

test('the rung is one-shot — a stale past date cannot re-fire it', () => {
  const sent = parked({ audit_last_email_key: EMAIL_KEYS.REENGAGE_1 })
  assert.equal(isReengageRelease(sent), false)
  assert.equal(nextEmailKey(sent), null)
})

test('sending the rung preserves the pause instead of re-arming emails 3-5', () => {
  for (const status of ['paused_booked', 'paused_reply', 'paused_manual', 'completed']) {
    assert.equal(
      resolveNextNurtureStatus(EMAIL_KEYS.REENGAGE_1, { audit_nurture_status: status }),
      status,
      status,
    )
  }
})

test('an unparked lead is completely unaffected by any of this', () => {
  const plain = {
    audit_nurture_status: 'active',
    audit_status: 'delivered',
    audit_pdf_url: 'https://example.com/a.pdf',
    audit_last_email_key: EMAIL_KEYS.EMAIL_3,
    audit_last_email_sent_at: new Date(Date.now() - 3 * DAY).toISOString(),
  }
  assert.equal(nextEmailKey(plain), EMAIL_KEYS.EMAIL_4)
  assert.equal(isReengageRelease(plain), false)
  assert.equal(nextEmailKey({ ...plain, audit_nurture_status: 'paused_booked' }), null)
})
