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
// redirect URIs" (Google Cloud Console → APIs & Services → Credentials).
//
// Usage (pull the client id/secret from Vercel first):
//   vercel env pull .env.oauth --environment=production   # or paste them inline
//   GOOGLE_DRIVE_CLIENT_ID=... GOOGLE_DRIVE_CLIENT_SECRET=... \
//     node scripts/oauth/get-gmail-refresh-token.mjs
// Open the printed URL, approve as abe@soraiadesigns.com, then copy the refresh
// token into Vercel as GOOGLE_DRIVE_REFRESH_TOKEN (Production/Preview/Development)
// and redeploy. Drive folder creation keeps working (scope retained).

import http from 'node:http'
import { URL } from 'node:url'

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET
const PORT = Number(process.env.OAUTH_CALLBACK_PORT || 5199)
const REDIRECT = `http://localhost:${PORT}/oauth2callback`
// Keep Drive so the re-consented token still creates prospect folders; add gmail.send.
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.send',
]

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET (pull them from Vercel).')
  process.exit(1)
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', SCOPES.join(' '))
authUrl.searchParams.set('access_type', 'offline')
authUrl.searchParams.set('prompt', 'consent') // force a refresh_token even on re-consent
authUrl.searchParams.set('login_hint', 'abe@soraiadesigns.com')

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`)
  if (u.pathname !== '/oauth2callback') { res.writeHead(404); res.end(); return }
  const code = u.searchParams.get('code')
  if (!code) { res.writeHead(400); res.end('no code in callback'); return }
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
      res.writeHead(200)
      res.end('No refresh_token returned. Revoke the prior grant at myaccount.google.com/permissions, then retry.')
      console.error('\nNo refresh_token in response:', JSON.stringify(tok, null, 2))
    } else {
      res.writeHead(200)
      res.end('Done — refresh token captured. Return to the terminal.')
      console.log('\n=== NEW REFRESH TOKEN (Drive + gmail.send) ===\n')
      console.log(tok.refresh_token)
      console.log('\nScopes granted:', tok.scope)
      console.log('\nNext: set GOOGLE_DRIVE_REFRESH_TOKEN in Vercel (all environments), then redeploy.')
    }
  } catch (e) {
    res.writeHead(500); res.end('token exchange failed')
    console.error(e)
  } finally {
    setTimeout(() => server.close(() => process.exit(0)), 500)
  }
})

server.listen(PORT, () => {
  console.log('\n1) Ensure this redirect URI is registered on the OAuth client:')
  console.log(`   ${REDIRECT}`)
  console.log('\n2) Open this URL, sign in as abe@soraiadesigns.com, and approve:\n')
  console.log(authUrl.toString())
  console.log(`\nWaiting for the redirect on ${REDIRECT} ...`)
})
