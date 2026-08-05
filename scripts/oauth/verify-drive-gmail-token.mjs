#!/usr/bin/env node
// Read-only end-to-end check of GOOGLE_DRIVE_REFRESH_TOKEN:
// 1) refresh → access token, 2) tokeninfo scopes, 3) Drive files.list ping,
// 4) Gmail messages.list ping. Zero side effects.

import { readFileSync } from 'node:fs'

for (const p of ['.env.verify', '.env.oauth', '.env']) {
  try {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const t = line.trim(); if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('='); if (eq < 1) continue
      const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (!(k in process.env)) process.env[k] = v
    }
  } catch {}
}

const CID = process.env.GOOGLE_DRIVE_CLIENT_ID
const CS = process.env.GOOGLE_DRIVE_CLIENT_SECRET
const RT = process.env.GOOGLE_DRIVE_REFRESH_TOKEN
if (!CID || !CS || !RT) { console.error('missing creds'); process.exit(1) }

const REQUIRED = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
]

const tokRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: CID, client_secret: CS, refresh_token: RT, grant_type: 'refresh_token' }),
})
const tok = await tokRes.json()
if (!tokRes.ok || !tok.access_token) { console.error('refresh failed:', tokRes.status, JSON.stringify(tok)); process.exit(1) }
console.log('[1/4] refresh: OK  (expires_in=' + tok.expires_in + 's)')

const infoRes = await fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(tok.access_token))
const info = await infoRes.json()
if (!infoRes.ok) { console.error('tokeninfo failed:', infoRes.status, JSON.stringify(info)); process.exit(1) }
const granted = String(info.scope || '').split(/\s+/).filter(Boolean)
const missing = REQUIRED.filter((s) => !granted.includes(s))
console.log('[2/4] scopes granted:', granted.join(' '))
if (missing.length) { console.error('MISSING scopes:', missing.join(' ')); process.exit(1) }
console.log('       all required scopes present')

const driveRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)', {
  headers: { Authorization: 'Bearer ' + tok.access_token },
})
const drive = await driveRes.json()
if (!driveRes.ok) { console.error('drive files.list failed:', driveRes.status, JSON.stringify(drive)); process.exit(1) }
console.log('[3/4] drive files.list: OK  (sample=' + (drive.files?.[0]?.name || '(no files)') + ')')

const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1', {
  headers: { Authorization: 'Bearer ' + tok.access_token },
})
const gmail = await gmailRes.json()
if (!gmailRes.ok) { console.error('gmail messages.list failed:', gmailRes.status, JSON.stringify(gmail)); process.exit(1) }
console.log('[4/4] gmail messages.list: OK  (approx=' + (gmail.resultSizeEstimate ?? '?') + ')')

console.log('\nALL GOOD — token is valid, scopes match, both APIs respond.')
