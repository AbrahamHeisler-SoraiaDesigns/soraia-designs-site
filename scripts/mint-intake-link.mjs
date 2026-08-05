#!/usr/bin/env node
// Mint a per-client onboarding intake link.
//
// Manual path for now. Phase 5 wires June's kickoff step to this so the link is
// generated with the folder id she already holds in her ledger, rather than anyone
// hand-assembling one.
//
// Usage:
//   INTAKE_TOKEN_SECRET=... node scripts/mint-intake-link.mjs \
//     --deal 339777464002 --folder 1Q-WQ... --name "Unis Taye" [--days 30]
//
// The folder id is the CLIENT ROOT folder ("<Name> — Client Folder"), which June
// stores as drive.folder_id in ~/.hermes/state/soraia-fulfillment/projects.json.
import { signIntakeToken, buildIntakeUrl, DEFAULT_TTL_DAYS } from '../api/_lib/intake-token.js'

function arg(flag, fallback = undefined) {
  const i = process.argv.indexOf(flag)
  return i === -1 ? fallback : process.argv[i + 1]
}

const dealId = arg('--deal')
const folderId = arg('--folder')
const clientName = arg('--name', '')
const ttlDays = Number(arg('--days', DEFAULT_TTL_DAYS))

if (!dealId || !folderId) {
  console.error('Usage: mint-intake-link.mjs --deal <dealId> --folder <clientRootFolderId> [--name "Client Name"] [--days 30]')
  process.exit(1)
}

try {
  const token = signIntakeToken({ dealId, folderId, clientName, ttlDays })
  const expires = new Date(Date.now() + ttlDays * 86400_000).toISOString().slice(0, 10)
  console.log(buildIntakeUrl(token))
  console.error(`\n  client:  ${clientName || '(unnamed)'}\n  deal:    ${dealId}\n  folder:  ${folderId}\n  expires: ${expires}`)
} catch (err) {
  console.error(`Failed: ${err.message}`)
  process.exit(1)
}
