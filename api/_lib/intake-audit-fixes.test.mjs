// Regression tests for the six defects found in the 2026-08-05 audit of phases 3–4.
// Each test names the defect it locks down, so a future refactor that reintroduces
// one fails here with the reason rather than a bare assertion.
// Run: node api/_lib/intake-audit-fixes.test.mjs
import assert from 'node:assert'
import fs from 'node:fs'
import vm from 'node:vm'

const { validateUpload, extensionOf } = await import('./intake-upload.js')
const { validateAnswers, normalizeAnswers, safeHttpUrl } = await import('./intake-questions.js')
const { buildRowMap } = await import('./intake-sheet.js')
const { renderBriefHtml } = await import('./intake-brief.js')

let passed = 0
const t = (name, fn) => { fn(); passed += 1; console.log(`  ✓ ${name}`) }

// --- 1. token exposure to third-party tags --------------------------------
const indexHtml = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const appJsx = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8')

// Rather than string-matching the guard, run index.html's inline <head> scripts in
// a fake DOM and observe what they actually inject. String assertions would pass a
// refactor that moved the injection outside the guard; this would not.
function scriptsInjectedOn(pathname) {
  const inline = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  const injected = []
  const el = () => {
    const node = { tagName: 'SCRIPT', async: false, defer: false, type: '', id: '' }
    let _src = ''
    Object.defineProperty(node, 'src', {
      get: () => _src,
      set: (v) => { _src = v; injected.push(v) },
    })
    node.parentNode = { insertBefore: () => {} }
    return node
  }
  const sandbox = {
    window: null,
    document: {
      createElement: el,
      getElementsByTagName: () => [el()],
      head: { appendChild: () => {} },
    },
    location: { pathname },
  }
  sandbox.window = sandbox
  sandbox.window.location = sandbox.location
  const ctx = vm.createContext(sandbox)
  for (const src of inline) {
    try { vm.runInContext(src, ctx) } catch { /* non-guard scripts may need more DOM */ }
  }
  return injected
}

t('NOTHING third-party is injected on /intake', () => {
  const injected = scriptsInjectedOn('/intake')
  assert.deepStrictEqual(injected, [], `leaked: ${injected.join(', ')}`)
})

t('the pixel and HubSpot still load on every other route', () => {
  const injected = scriptsInjectedOn('/').join(' ')
  assert.match(injected, /connect\.facebook\.net/, 'pixel stopped loading on normal pages')
  assert.match(injected, /hs-scripts\.com/, 'HubSpot stopped loading on normal pages')
})

t('client-side navigation into /intake does not fire a PageView', () => {
  assert.match(appJsx, /intake/, 'App.jsx must skip the pixel on /intake')
  assert.ok(appJsx.indexOf('intake') < appJsx.indexOf("fbq('track'"),
    'the /intake guard must come before the fbq call')
})

t('/intake sends no referrer', () => {
  const vercel = JSON.parse(fs.readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'))
  const rule = vercel.headers?.find((h) => h.source === '/intake')
  assert.ok(rule, 'no header rule for /intake')
  assert.strictEqual(rule.headers.find((h) => h.key === 'Referrer-Policy')?.value, 'no-referrer')
})

// --- 2. required file answers need a real Drive id ------------------------
const BASE = { full_name: 'A', property_address: 'B', total_furnishings_budget: 'C' }

t('a fabricated file list no longer satisfies the required photos', () => {
  const r = validateAnswers({ ...BASE, inspiration_files: [{ name: 'never-uploaded.jpg' }] })
  assert.strictEqual(r.ok, false)
  assert.ok(r.missing.some((m) => m.id === 'inspiration_files'))
})

t('a real upload (has a Drive id) still satisfies it', () => {
  const r = validateAnswers({ ...BASE, inspiration_files: [{ name: 'k.jpg', id: '1AbC' }] })
  assert.strictEqual(r.ok, true)
})

t('one real file among fabricated ones is enough', () => {
  const r = validateAnswers({ ...BASE, inspiration_files: [{ name: 'a.jpg' }, { name: 'b.jpg', id: 'x' }] })
  assert.strictEqual(r.ok, true)
})

t('non-required file questions are unaffected', () => {
  const r = validateAnswers({ ...BASE, inspiration_files: [{ name: 'k.jpg', id: '1' }],
    property_photos: [{ name: 'p.jpg' }] })
  assert.strictEqual(r.ok, true)
})

// --- 3. untyped uploads (HEIC, CAD) ---------------------------------------
t('an untyped HEIC is accepted for the REQUIRED inspiration question', () => {
  const r = validateUpload({ kind: 'inspiration', contentType: 'application/octet-stream', size: 100, filename: 'IMG_1514.HEIC' })
  assert.strictEqual(r.ok, true, r.message)
})

t('an empty content type falls back to the extension too', () => {
  assert.strictEqual(validateUpload({ kind: 'inspiration', contentType: '', size: 100, filename: 'a.jpg' }).ok, true)
})

t('untyped CAD works for floor plans', () => {
  assert.strictEqual(validateUpload({ kind: 'floor_plans', contentType: '', size: 100, filename: 'plan.dwg' }).ok, true)
})

t('the extension fallback is NOT a hole — .exe is still refused', () => {
  const r = validateUpload({ kind: 'inspiration', contentType: 'application/octet-stream', size: 100, filename: 'evil.exe' })
  assert.strictEqual(r.ok, false)
  assert.strictEqual(r.reason, 'bad_type')
})

t('CAD is still refused for inspiration even untyped', () => {
  assert.strictEqual(validateUpload({ kind: 'inspiration', contentType: '', size: 100, filename: 'x.dwg' }).ok, false)
})

t('an untyped file with no extension is refused with a human message', () => {
  const r = validateUpload({ kind: 'inspiration', contentType: '', size: 100, filename: 'noextension' })
  assert.strictEqual(r.ok, false)
  assert.match(r.message, /could not tell/i)
})

t('a declared bad type is still refused regardless of extension', () => {
  assert.strictEqual(validateUpload({ kind: 'inspiration', contentType: 'text/html', size: 10, filename: 'a.jpg' }).ok, false)
})

t('extensionOf handles the awkward cases', () => {
  assert.strictEqual(extensionOf('IMG.HEIC'), 'heic')
  assert.strictEqual(extensionOf('a.b.c.pdf'), 'pdf')
  assert.strictEqual(extensionOf('noext'), '')
  assert.strictEqual(extensionOf(''), '')
})

// --- 4. hidden answers must not reach the Sheet ---------------------------
t('an answer to a hidden conditional question is blanked in the Sheet', () => {
  const answers = normalizeAnswers({ ...BASE, inspiration_files: [{ name: 'k.jpg', id: '1' }],
    murals: 'No', mural_property_name: 'Yes' })
  const row = buildRowMap({ submittedAt: 't', dealId: 'd', clientName: 'c', briefUrl: '', folderUrl: '', answers })
  assert.strictEqual(row['If yes — add the property name to it?'], '',
    'stale answer to a hidden question leaked into the Sheet')
})

t('the same answer IS written when its condition holds', () => {
  const answers = normalizeAnswers({ ...BASE, inspiration_files: [{ name: 'k.jpg', id: '1' }],
    murals: 'Yes', mural_property_name: 'Yes' })
  const row = buildRowMap({ submittedAt: 't', dealId: 'd', clientName: 'c', briefUrl: '', folderUrl: '', answers })
  assert.strictEqual(row['If yes — add the property name to it?'], 'Yes')
})

// --- 5. client-supplied URLs into the brief -------------------------------
t('javascript: and data: URLs never reach an href', () => {
  for (const bad of ['javascript:alert(1)', 'data:text/html,<script>', 'vbscript:x']) {
    const answers = normalizeAnswers({ inspiration_files: [{ name: 'a.jpg', url: bad }] })
    const html = renderBriefHtml({ clientName: 'c', answers, submittedAt: 't', dealId: 'd' })
    assert.ok(!html.includes(bad), `${bad} reached the brief`)
  }
})

t('a bad url falls back to the Drive link when there is an id', () => {
  const answers = normalizeAnswers({ inspiration_files: [{ name: 'a.jpg', id: 'FILE1', url: 'javascript:x' }] })
  assert.strictEqual(answers.inspiration_files[0].url, 'https://drive.google.com/file/d/FILE1/view')
})

t('a legitimate https url survives', () => {
  assert.strictEqual(safeHttpUrl('https://drive.google.com/file/d/x/view'), 'https://drive.google.com/file/d/x/view')
  assert.strictEqual(safeHttpUrl('javascript:alert(1)'), null)
  assert.strictEqual(safeHttpUrl(''), null)
  assert.strictEqual(safeHttpUrl(null), null)
})

// --- 6. non-ASCII client names in the greeting ----------------------------
// peekToken used atob directly, which is Latin-1, so "José" greeted the client as
// "JosÃ©" on the one screen meant to feel personal.
process.env.INTAKE_TOKEN_SECRET = 'audit-fixes-secret-long-enough-to-pass-the-check'
const { signIntakeToken } = await import('./intake-token.js')
const { peekToken } = await import('../../src/lib/intake-draft.js')

t('accented and non-Latin client names survive the token round trip', () => {
  for (const name of ['José Muñoz', 'Chloé Baptiste', '田中 さくら', "O'Brien-Smith"]) {
    const got = peekToken(signIntakeToken({ dealId: '1', folderId: 'f', clientName: name }))
    assert.strictEqual(got.clientName, name, `${name} was mangled`)
  }
})

t('peekToken still fails soft on junk rather than throwing', () => {
  for (const junk of ['', null, undefined, 'not-a-token', 'a.b.c']) {
    assert.doesNotThrow(() => peekToken(junk))
  }
})

console.log(`\nALL ${passed} PASS`)
