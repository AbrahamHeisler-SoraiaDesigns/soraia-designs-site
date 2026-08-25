import { test } from 'node:test'
import assert from 'node:assert/strict'

import { captureFirstTouch, getFirstTouch } from '../src/lib/attribution.js'
import { auditContactProps } from '../api/_lib/hubspot.js'

const AD_URL =
  'https://www.soraiadesigns.com/audit?utm_source=meta&utm_medium=paid&utm_campaign=audit-test-2026-06&utm_content=human-designer&fbclid=abc123'

// The module reads window at call time, so a plain stub is enough.
function stubWindow(href, { storage = new Map(), throws = false } = {}) {
  const search = href.includes('?') ? href.slice(href.indexOf('?')) : ''
  globalThis.window = {
    location: { href, search },
    sessionStorage: {
      getItem: (k) => {
        if (throws) throw new Error('storage disabled')
        return storage.has(k) ? storage.get(k) : null
      },
      setItem: (k, v) => {
        if (throws) throw new Error('storage disabled')
        storage.set(k, v)
      },
    },
  }
  return storage
}

test('captureFirstTouch stashes the tagged landing', () => {
  stubWindow(AD_URL)
  captureFirstTouch()
  const touch = getFirstTouch()
  assert.equal(touch.utm_source, 'meta')
  assert.equal(touch.utm_medium, 'paid')
  assert.equal(touch.utm_campaign, 'audit-test-2026-06')
  assert.equal(touch.utm_content, 'human-designer')
  assert.equal(touch.fbclid, 'abc123')
  assert.equal(touch.landing_page, AD_URL)
})

test('captureFirstTouch ignores an untagged landing', () => {
  stubWindow('https://www.soraiadesigns.com/audit')
  captureFirstTouch()
  assert.deepEqual(getFirstTouch(), {})
})

test('first touch wins: a later tagged load does not overwrite the stash', () => {
  const storage = stubWindow(AD_URL)
  captureFirstTouch()

  stubWindow('https://www.soraiadesigns.com/book?utm_source=audit_nurture&utm_medium=email', { storage })
  captureFirstTouch()

  assert.equal(getFirstTouch().utm_source, 'meta')
})

test('storage failures degrade to no attribution instead of throwing', () => {
  stubWindow(AD_URL, { throws: true })
  assert.doesNotThrow(captureFirstTouch)
  assert.deepEqual(getFirstTouch(), {})
})

test('auditContactProps writes utms that are present', () => {
  const props = auditContactProps({
    email: 'jordan@example.com',
    full_name: 'Jordan Example',
    utm_source: 'meta',
    utm_medium: 'paid',
    utm_campaign: 'audit-test-2026-06',
    utm_content: 'human-designer',
  })
  assert.equal(props.utm_source, 'meta')
  assert.equal(props.utm_medium, 'paid')
  assert.equal(props.utm_campaign, 'audit-test-2026-06')
  assert.equal(props.utm_content, 'human-designer')
})

test('auditContactProps drops blank utms so a repeat submit cannot erase first touch', () => {
  const props = auditContactProps({ email: 'jordan@example.com', full_name: 'Jordan Example' })
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    assert.equal(key in props, false, `${key} should not be written when blank`)
  }
  // Non-utm props still write blanks, which is the existing Stage-1 contract.
  assert.equal(props.email, 'jordan@example.com')
  assert.equal(props.audit_property_street, '')
})
