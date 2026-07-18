#!/usr/bin/env node
// Fix the enum drift that breaks the unsubscribe / bounce / spam suppression path.
//
// Root cause (Maya, 2026-07-17): api/audit-nurture-event.js writes status values
// that don't exist in the HubSpot property enums. HubSpot PATCHes are atomic, so
// the whole suppression write is rejected with 400 VALIDATION_ERROR -> the unsub
// handler 500s -> the contact stays enrolled and keeps getting mailed.
//
// This script adds ONLY the missing options to each property, idempotently:
// it GETs the current options, appends any that are absent, and PATCHes back the
// FULL options array (HubSpot truncates to whatever array you send — partial
// arrays delete the rest, so we always send current + additions).
//
// Usage:
//   HUBSPOT_SERVICE_KEY=... node scripts/fix-nurture-enums.mjs --check   # read-only, report drift
//   HUBSPOT_SERVICE_KEY=... node scripts/fix-nurture-enums.mjs           # apply the additions
//
// Safe: additive only, never removes or reorders existing options. Re-running is a
// no-op once the options exist. hs_lead_status is a HubSpot-DEFINED property; if it
// refuses custom options the script reports that clearly so we can fall back to
// mapping code -> existing values instead (Maya's documented plan B).

const KEY = process.env.HUBSPOT_SERVICE_KEY
if (!KEY) {
  console.error('HUBSPOT_SERVICE_KEY missing. Pull it from Vercel prod env or 1Password and re-run.')
  process.exit(2)
}
const APPLY = !process.argv.includes('--check')

// property name -> options to ensure exist (value + human label)
const TARGETS = {
  audit_nurture_status: [
    { value: 'unsubscribed', label: 'Unsubscribed' },
    { value: 'bounced', label: 'Bounced' },
    { value: 'complained', label: 'Spam Complaint' },
    { value: 'paused_manual', label: 'Paused (Manual)' },
  ],
  hs_lead_status: [
    { value: 'UNSUBSCRIBED', label: 'Unsubscribed' },
    { value: 'BOUNCED', label: 'Bounced' },
    { value: 'SPAM_COMPLAINT', label: 'Spam Complaint' },
    { value: 'REPLIED', label: 'Replied' },
  ],
}

async function hs(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    const err = new Error(`HubSpot ${method} ${path} -> ${res.status}: ${text}`)
    err.status = res.status
    throw err
  }
  return text ? JSON.parse(text) : null
}

let exitCode = 0

for (const [name, wanted] of Object.entries(TARGETS)) {
  console.log(`\n=== ${name} ===`)
  let prop
  try {
    prop = await hs(`/crm/v3/properties/contacts/${name}`)
  } catch (err) {
    console.error(`  FAILED to read property: ${err.message}`)
    exitCode = 1
    continue
  }
  const existing = Array.isArray(prop.options) ? prop.options : []
  const existingValues = new Set(existing.map((o) => o.value))
  const missing = wanted.filter((o) => !existingValues.has(o.value))

  console.log(`  existing options: ${existing.map((o) => o.value).join(', ') || '(none)'}`)
  if (missing.length === 0) {
    console.log('  ✓ all required options already present — no change')
    continue
  }
  console.log(`  MISSING: ${missing.map((o) => o.value).join(', ')}`)

  if (!APPLY) {
    console.log('  (--check mode: not applying)')
    exitCode = 1
    continue
  }

  // Full array = existing (unchanged) + missing (appended after the last displayOrder).
  const maxOrder = existing.reduce((m, o) => Math.max(m, Number(o.displayOrder) || 0), -1)
  const additions = missing.map((o, i) => ({
    label: o.label,
    value: o.value,
    displayOrder: maxOrder + 1 + i,
    hidden: false,
  }))
  const options = [...existing, ...additions]

  try {
    await hs(`/crm/v3/properties/contacts/${name}`, { method: 'PATCH', body: { options } })
    console.log(`  ✓ added: ${additions.map((o) => o.value).join(', ')}`)
  } catch (err) {
    console.error(`  FAILED to patch: ${err.message}`)
    if (name === 'hs_lead_status') {
      console.error('  hs_lead_status is a HubSpot-DEFINED property. If it refuses custom options,')
      console.error('  fall back to mapping code -> existing values (Maya plan B): UNQUALIFIED for')
      console.error('  unsub/bounce/complaint, CONNECTED or IN_PROGRESS for replied.')
    }
    exitCode = 1
  }
}

console.log(APPLY ? '\nDone.' : '\nCheck complete.')
process.exit(exitCode)
