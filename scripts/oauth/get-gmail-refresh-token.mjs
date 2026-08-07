#!/usr/bin/env node
// ONE-TIME helper: re-consent the existing Google OAuth client to ADD gmail.send,
// then print a new refresh token (Drive + gmail.send) for Vercel.
//
// Why: the current GOOGLE_DRIVE_REFRESH_TOKEN was minted with Drive scope only.
// Sending as abe@ needs gmail.send granted via a fresh consent. This does NOT
// change any account settings — it mints a token Abe explicitly approves in the
// browser. Abe runs this; the agent never grants consent on his behalf.
//
// Prereq: register the redirect URI below in the OAuth client's "Authorized
// redirect URIs" (Google Cloud Console -> APIs & Services -> Credentials).
//
// Usage (any one of):
//   node --env-file=.env.oauth scripts/oauth/get-gmail-refresh-token.mjs
//   node scripts/oauth/get-gmail-refresh-token.mjs      # auto-loads ./.env.oauth
//   GOOGLE_DRIVE_CLIENT_ID=... GOOGLE_DRIVE_CLIENT_SECRET=... node scripts/oauth/get-gmail-refresh-token.mjs
// Then open the printed URL, approve as abe@, copy the printed refresh token into
// Vercel as GOOGLE_DRIVE_REFRESH_TOKEN (all envs), and redeploy. Drive folder
// creation keeps working (Drive scope retained).

import http from 'node:http'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { URL } from 'node:url'

// Self-load ./.env.oauth (or ./.env) when the vars aren't already in the env, so
// the plain `node ...` form works without fragile shell sourcing. Values are
// parsed literally (no shell expansion), sidestepping zsh quoting issues.
function loadEnvFile() {
  if (process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET) return
  for (const path of ['.env.oauth', '.env']) {
    try {
      const text = readFileSync(path, 'utf8')
      for (const line of text.split('\n')) {
        const t = line.trim()
        if (!t || t.startsWith('#')) continue
        const eq = t.indexOf('=')
        if (eq < 1) continue
        const key = t.slice(0, eq).trim()
        let val = t.slice(eq + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!(key in process.env)) process.env[key] = val
      }
    } catch { /* file absent — fine */ }
  }
}
loadEnvFile()

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET
const PORT = Number(process.env.OAUTH_CALLBACK_PORT || 5199)
const REDIRECT = `http://localhost:${PORT}/oauth2callback`
const STATE = randomBytes(16).toString('hex')
// Keep Drive so the re-consented token still creates prospect folders; add gmail.send.
// gmail.readonly added 2026-07-21: the reply gate (hasRecentInboundFrom) calls
// messages.list, which gmail.send does NOT authorize. Without it, every live send
// 403s inside the gate and fails CLOSED — the whole ladder stalls silently.
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
]

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET.')
  console.error('Run `vercel env pull .env.oauth --environment=production` first, then re-run this script.')
  process.exit(1)
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', SCOPES.join(' '))
authUrl.searchParams.set('access_type', 'offline')
authUrl.searchParams.set('prompt', 'consent') // force a refresh_token even on re-consent
authUrl.searchParams.set('state', STATE)
authUrl.searchParams.set('login_hint', 'abe@soraiadesigns.com')

function done(server, res, code, message, exit) {
  res.writeHead(code); res.end(message)
  setTimeout(() => server.close(() => process.exit(exit)), 400)
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`)
  if (u.pathname !== '/oauth2callback') { res.writeHead(404); res.end(); return }
  if (u.searchParams.get('error')) {
    console.error('OAuth error:', u.searchParams.get('error'))
    return done(server, res, 200, 'Consent denied/errored. Return to the terminal.', 1)
  }
  if (u.searchParams.get('state') !== STATE) {
    console.error('State mismatch — possible CSRF. Aborting.')
    return done(server, res, 400, 'State mismatch. Return to the terminal.', 1)
  }
  const code = u.searchParams.get('code')
  if (!code) return done(server, res, 400, 'No authorization code in callback.', 1)
  try {
    const tokRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT,
        grant_type: 'authorization_code',
      }),
    })
    const tok = await tokRes.json()
    if (!tok.refresh_token) {
      console.error('\nNo refresh_token in response:', JSON.stringify(tok, null, 2))
      return done(server, res, 200, 'No refresh_token returned. Revoke prior grant at myaccount.google.com/permissions and retry.', 1)
    }
    console.log('\n=== NEW REFRESH TOKEN (Drive + gmail.send) ===\n')
    console.log(tok.refresh_token)
    console.log('\nScopes granted:', tok.scope)
    console.log('\nNext: set GOOGLE_DRIVE_REFRESH_TOKEN in Vercel (all environments), then redeploy.')
    return done(server, res, 200, 'Done — refresh token captured. Return to the terminal.', 0)
  } catch (e) {
    console.error(e)
    return done(server, res, 500, 'Token exchange failed.', 1)
  }
})

server.listen(PORT, () => {
  console.log('\n1) Ensure this redirect URI is registered on the OAuth client:')
  console.log(`   ${REDIRECT}`)
  console.log('\n2) Open this URL, sign in as abe@soraiadesigns.com, and approve:\n')
  console.log(authUrl.toString())
  console.log(`\nWaiting for the redirect on ${REDIRECT} ...`)
})
