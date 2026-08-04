// Unit tests for intake link tokens. Pure crypto/logic — no Drive or HubSpot —
// so it runs with plain `node`.
// Run: node api/_lib/intake-token.test.mjs
import assert from 'node:assert'

process.env.INTAKE_TOKEN_SECRET = 'test-secret-that-is-long-enough-to-pass-the-length-check'

const { signIntakeToken, verifyIntakeToken, buildIntakeUrl, TOKEN_VERSION } =
  await import('./intake-token.js')

let passed = 0
const t = (name, fn) => {
  fn()
  passed += 1
  console.log(`  ✓ ${name}`)
}

const BASE = { dealId: '339777464002', folderId: '1Q-WQVYV2Ab5ecWXmCO1Im4X4BtrVEgbR', clientName: 'Unis Taye' }

t('round-trips deal, folder and name', () => {
  const r = verifyIntakeToken(signIntakeToken(BASE))
  assert.strictEqual(r.ok, true)
  assert.strictEqual(r.payload.dealId, BASE.dealId)
  assert.strictEqual(r.payload.folderId, BASE.folderId)
  assert.strictEqual(r.payload.clientName, 'Unis Taye')
})

t('token is URL-safe (survives a query string untouched)', () => {
  const tok = signIntakeToken(BASE)
  assert.strictEqual(encodeURIComponent(tok), tok)
  assert.ok(!/[+/=]/.test(tok))
})

// The whole point of signing: a client must not be able to retarget their own
// link at another client's folder by editing the payload.
t('tampered folder id is rejected', () => {
  const tok = signIntakeToken(BASE)
  const [payloadB64, sig] = tok.split('.')
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
  payload.folder = 'SOMEONE-ELSES-FOLDER'
  const forged = Buffer.from(JSON.stringify(payload)).toString('base64url') + '.' + sig
  assert.deepStrictEqual(verifyIntakeToken(forged), { ok: false, reason: 'bad_signature' })
})

t('tampered expiry is rejected', () => {
  const tok = signIntakeToken({ ...BASE, ttlDays: -1 })
  const [payloadB64, sig] = tok.split('.')
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
  payload.exp = Math.floor(Date.now() / 1000) + 99999
  const forged = Buffer.from(JSON.stringify(payload)).toString('base64url') + '.' + sig
  assert.strictEqual(verifyIntakeToken(forged).ok, false)
})

t('signature from a different secret is rejected', () => {
  const tok = signIntakeToken(BASE)
  process.env.INTAKE_TOKEN_SECRET = 'a-completely-different-secret-also-long-enough-yes'
  const r = verifyIntakeToken(tok)
  process.env.INTAKE_TOKEN_SECRET = 'test-secret-that-is-long-enough-to-pass-the-length-check'
  assert.deepStrictEqual(r, { ok: false, reason: 'bad_signature' })
})

t('expired token is rejected with a distinguishable reason', () => {
  const past = Date.now() - 40 * 86400 * 1000
  const tok = signIntakeToken({ ...BASE, now: past })
  const r = verifyIntakeToken(tok)
  // 'expired' must be its own reason: it maps to "ask June for a fresh link",
  // not to the 403 that a forged token gets.
  assert.deepStrictEqual(r, { ok: false, reason: 'expired' })
})

t('token valid right up to, and not including, its expiry second', () => {
  const now = Date.now()
  const tok = signIntakeToken({ ...BASE, ttlDays: 1, now })
  const expMs = (Math.floor(now / 1000) + 86400) * 1000
  assert.strictEqual(verifyIntakeToken(tok, { now: expMs - 1000 }).ok, true)
  assert.strictEqual(verifyIntakeToken(tok, { now: expMs }).ok, false)
})

t('garbage inputs are rejected, never thrown on', () => {
  for (const bad of ['', null, undefined, 'nodot', 'a.b.c', '.', 'x.', '.y', 42, {}]) {
    const r = verifyIntakeToken(bad)
    assert.strictEqual(r.ok, false, `expected rejection for ${JSON.stringify(bad)}`)
  }
})

t('valid signature over a non-JSON payload is rejected', () => {
  // Guards the decode path: a correctly-signed but corrupt payload must not throw.
  assert.strictEqual(verifyIntakeToken('bm90LWpzb24.x').ok, false)
})

t('version bump invalidates old tokens', () => {
  const tok = signIntakeToken(BASE)
  const [payloadB64] = tok.split('.')
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
  assert.strictEqual(payload.v, TOKEN_VERSION)
})

t('minting requires both deal and folder', () => {
  assert.throws(() => signIntakeToken({ folderId: 'f' }), /dealId required/)
  assert.throws(() => signIntakeToken({ dealId: 'd' }), /folderId required/)
})

t('a weak or missing secret refuses to mint', () => {
  const saved = process.env.INTAKE_TOKEN_SECRET
  for (const weak of ['', 'short', undefined]) {
    if (weak === undefined) delete process.env.INTAKE_TOKEN_SECRET
    else process.env.INTAKE_TOKEN_SECRET = weak
    assert.throws(() => signIntakeToken(BASE), /INTAKE_TOKEN_SECRET/)
  }
  process.env.INTAKE_TOKEN_SECRET = saved
})

t('missing secret fails verification closed, not open', () => {
  const tok = signIntakeToken(BASE)
  const saved = process.env.INTAKE_TOKEN_SECRET
  delete process.env.INTAKE_TOKEN_SECRET
  const r = verifyIntakeToken(tok)
  process.env.INTAKE_TOKEN_SECRET = saved
  assert.strictEqual(r.ok, false)
  assert.strictEqual(r.reason, 'server_misconfigured')
})

t('buildIntakeUrl produces a clean single-slash URL', () => {
  const tok = signIntakeToken(BASE)
  assert.strictEqual(buildIntakeUrl(tok, 'https://soraiadesigns.com/'), `https://soraiadesigns.com/intake?t=${tok}`)
  assert.strictEqual(buildIntakeUrl(tok, 'https://soraiadesigns.com'), `https://soraiadesigns.com/intake?t=${tok}`)
})

console.log(`\nALL ${passed} PASS`)
