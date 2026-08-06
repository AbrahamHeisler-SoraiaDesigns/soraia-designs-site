import test from 'node:test'
import assert from 'node:assert/strict'
import { addressKey, addressKeyFromDeal } from '../api/_lib/audit-utils.js'

// One property, one deal (Abe, 2026-08-06). These cases are the real records
// that produced Robert Correale's duplicate: an audit deal and a design deal
// describing the same house under different names.

test('same address survives street-type and case differences', () => {
  const a = addressKey('127 Hawthorne Branch Rd, Broken Bow, OK')
  assert.equal(a, addressKey('127 Hawthorne Branch Road, Broken Bow OK'))
  assert.equal(a, addressKey('127 HAWTHORNE BRANCH RD., Broken Bow, OK'))
})

test('directional and unit abbreviations normalize', () => {
  assert.equal(addressKey('9330 NW 62nd Ct'), addressKey('9330 Northwest 62nd Court'))
  assert.equal(addressKey('507 15th Ave S'), addressKey('507 15th Avenue South'))
})

test('different houses on the same street do NOT collide', () => {
  assert.notEqual(addressKey('127 Hawthorne Branch Rd'), addressKey('129 Hawthorne Branch Rd'))
  assert.notEqual(addressKey('492 Dempsey Dr'), addressKey('494 Dempsey Dr'))
})

test('a market with no house number yields no key', () => {
  // "Broken Bow, OK" is a market. If this returned a key, every lead in that
  // town would dedupe into one deal.
  assert.equal(addressKey('Broken Bow, OK'), '')
  assert.equal(addressKey(''), '')
  assert.equal(addressKey(null), '')
  assert.equal(addressKey('   '), '')
})

test('address is read out of a deal description', () => {
  const deal = {
    dealname: 'Robert correale - Audit',
    description: [
      'Property: 127 Hawthorne Branch Rd , Broken Bow , OK',
      'Listing URL: https://www.zillow.com/homedetails/127-Hawthorne-Branch-Rd-Broken-Bow-OK-74728/352410374_zpid/',
      'Prospect folder: https://drive.google.com/drive/folders/1Djch2GQD',
    ].join('\n'),
  }
  assert.equal(addressKeyFromDeal(deal), addressKey('127 Hawthorne Branch Road, Broken Bow, OK'))
})

test('address is read out of a deal name when the description has none', () => {
  const deal = {
    dealname: 'Robert Correale - Virtual Design + Branding (127 Hawthorne Branch Rd, Broken Bow OK)',
    description: '',
  }
  assert.equal(addressKeyFromDeal(deal), addressKey('127 Hawthorne Branch Rd, Broken Bow, OK'))
})

test('the two Correale deals resolve to the same property', () => {
  const audit = {
    dealname: 'Robert correale - Audit',
    description: 'Property: 127 Hawthorne Branch Rd , Broken Bow , OK',
  }
  const design = {
    dealname: 'Robert Correale - Virtual Design + Branding (127 Hawthorne Branch Rd, Broken Bow OK)',
    description: '',
  }
  const key = addressKeyFromDeal(audit)
  assert.notEqual(key, '')
  assert.equal(key, addressKeyFromDeal(design))
})

test('a deal with no address anywhere yields no key', () => {
  // Unis Taye's deal is the real example: the address never reached HubSpot.
  assert.equal(addressKeyFromDeal({ dealname: 'Unis Taye - Design + Procurement', description: 'Surprise, AZ property' }), '')
  assert.equal(addressKeyFromDeal({}), '')
})
