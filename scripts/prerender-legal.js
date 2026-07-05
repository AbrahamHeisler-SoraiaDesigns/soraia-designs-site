#!/usr/bin/env node
// Build-time SSR for the legal routes (/privacy, /terms).
//
// Why this exists: Twilio's A2P 10DLC verifier (and most compliance
// crawlers) fetch a URL with a plain HTTP GET and scan the raw response
// text. They do NOT execute JavaScript. Our app is a client-rendered SPA,
// so the served HTML was just an empty <div id="root"></div> — the policy
// text only appeared after React booted. Twilio couldn't see it and
// rejected the campaign twice (errors 30882 TERMS_AND_CONDITIONS_URL and
// 30908 PRIVACY_POLICY_URL).
//
// Fix: render the real Privacy/Terms React components to static HTML at
// build time and inject that markup into the served file's #root. Uses
// react-dom/server + esbuild (both pure JS, already installed) — no
// headless browser, so it runs fine in Vercel's build with no Chromium.
// The component stays the single source of truth: humans still get the
// live React render on top; crawlers get the same text in the raw HTML.
import { build } from 'esbuild'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, unlinkSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcDir = join(__dirname, '..', 'src')

// Small SSR entry: pull in the two page components + StaticRouter so
// <Link> has router context, and re-export React's server renderer.
const entrySource = `
  import React from 'react'
  import { renderToStaticMarkup } from 'react-dom/server'
  import { StaticRouter } from 'react-router'
  import Privacy from ${JSON.stringify(join(srcDir, 'pages', 'Privacy.jsx'))}
  import Terms from ${JSON.stringify(join(srcDir, 'pages', 'Terms.jsx'))}

  const PAGES = { '/privacy': Privacy, '/terms': Terms }

  export function render(path) {
    const Page = PAGES[path]
    if (!Page) throw new Error('No legal component registered for ' + path)
    return renderToStaticMarkup(
      React.createElement(StaticRouter, { location: path },
        React.createElement(Page))
    )
  }
`

// Bundle the SSR entry to a temp CJS file, then require it. Bundling (vs.
// importing .jsx directly) lets node run the JSX/ESM deps without any
// loader flags. CSS imports are stubbed — SSR only needs the markup.
export async function prerenderLegalRoutes(paths) {
  const require = createRequire(import.meta.url)
  const tmpFile = join(__dirname, `.prerender-legal.${process.pid}.cjs`)

  await build({
    stdin: { contents: entrySource, resolveDir: srcDir, loader: 'jsx' },
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: tmpFile,
    jsx: 'automatic',
    logLevel: 'silent',
    // The legal pages pull in Nav/Footer which import CSS; SSR ignores it.
    loader: { '.css': 'empty', '.png': 'empty', '.jpg': 'empty', '.svg': 'text' },
  })

  try {
    const mod = require(tmpFile)
    const out = {}
    for (const p of paths) out[p] = mod.render(p)
    return out
  } finally {
    try { unlinkSync(tmpFile) } catch {}
  }
}

// Allow standalone run for a quick sanity check: `node scripts/prerender-legal.js`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = await prerenderLegalRoutes(['/privacy', '/terms'])
  for (const [p, html] of Object.entries(out)) {
    console.log(`\n===== ${p} (${html.length} bytes) =====`)
    console.log(html.slice(0, 400))
  }
}
