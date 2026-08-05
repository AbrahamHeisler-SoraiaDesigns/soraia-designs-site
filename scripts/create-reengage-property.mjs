#!/usr/bin/env node
// Provision the `audit_reengage_after` contact property (dated re-engagement).
//
// Why a property and not a HubSpot task: a task is a reminder for a human, and the
// warm-but-not-now lead was already costing us a human touch we kept not making.
// This field is read by the nurture runner (api/_lib/nurture.js: nextEmailKey ->
// reengageHoldActive / isReengageRelease), so parking a lead on a date is a thing
// the system honors rather than a note someone has to open.
//
// Semantics, restated here because the CRM UI shows only the label:
//   date in the FUTURE -> hold. No nurture email of any kind goes out.
//   date REACHED, lead active -> the ladder simply resumes where it left off.
//   date REACHED, lead soft-paused -> one-shot reengage_1_timing_check, and the
//     pause is preserved afterwards (emails 3-5 are NOT re-armed).
//   hard opt-out (unsubscribed / bounced / complained / unqualified) -> nothing.
//     No date releases those, deliberately.
//
// Usage:
//   HUBSPOT_SERVICE_KEY=... node scripts/create-reengage-property.mjs --check
//   HUBSPOT_SERVICE_KEY=... node scripts/create-reengage-property.mjs
//
// Idempotent: if the property exists the script reports it and changes nothing. It
// never deletes or retypes an existing property — a type change on a live property
// is destructive to stored values, so that case is reported for a human to decide.

const KEY = process.env.HUBSPOT_SERVICE_KEY
if (!KEY) {
  console.error('HUBSPOT_SERVICE_KEY missing. Pull it from Vercel prod env or 1Password and re-run.')
  process.exit(1)
}

const CHECK_ONLY = process.argv.includes('--check')
const NAME = 'audit_reengage_after'
const GROUP = 'contactinformation'

const SPEC = {
  name: NAME,
  label: 'Audit: Re-engage After',
  description:
    'Park this lead until this date. Before it, no nurture email sends. On it, an active lead resumes the ladder and a paused lead gets one re-engagement check-in. Cleared automatically once that send goes out. Hard opt-outs are never released.',
  groupName: GROUP,
  type: 'date',
  fieldType: 'date',
  formField: false,
}

async function hs(path, init = {}) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // non-JSON error body — keep the raw text for the message below
  }
  return { ok: res.ok, status: res.status, json, text }
}

const existing = await hs(`/crm/v3/properties/contacts/${NAME}`)

if (existing.ok) {
  const p = existing.json || {}
  console.log(`EXISTS  ${NAME}`)
  console.log(`  label: ${p.label}`)
  console.log(`  type:  ${p.type} / ${p.fieldType}`)
  if (p.type !== SPEC.type) {
    console.error(
      `\nDRIFT: property is type "${p.type}", the runner expects "${SPEC.type}".` +
        `\nNot retyping it — that would rewrite stored values. Fix it in HubSpot by hand, or` +
        `\ndelete the property if it holds nothing you need and re-run this script.`,
    )
    process.exit(2)
  }
  console.log('\nNothing to do.')
  process.exit(0)
}

if (existing.status !== 404) {
  console.error(`Unexpected read of ${NAME}: ${existing.status} ${existing.text}`)
  process.exit(1)
}

console.log(`MISSING ${NAME} — needs creating (${SPEC.type}/${SPEC.fieldType}, group ${GROUP})`)

if (CHECK_ONLY) {
  console.log('\n--check: no write performed.')
  process.exit(0)
}

const created = await hs('/crm/v3/properties/contacts', { method: 'POST', body: JSON.stringify(SPEC) })
if (!created.ok) {
  console.error(`CREATE FAILED ${created.status}: ${created.text}`)
  process.exit(1)
}

console.log(`CREATED ${NAME} (${created.json?.type}/${created.json?.fieldType})`)
console.log('\nSet it on a contact to park them. The runner picks it up on the next cron pass.')
