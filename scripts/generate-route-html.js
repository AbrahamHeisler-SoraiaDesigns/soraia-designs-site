#!/usr/bin/env node
// Post-build: generate per-route index.html files with distinct heads.
// Vercel serves static files before rewrites, so each file gets its own etag.
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const baseHtml = readFileSync(join(distDir, 'index.html'), 'utf8')

const routes = [
  {
    path: 'audit',
    title: 'Free STR Property Audit | Soraia Designs',
    description:
      'Get a free STR property audit from Soraia Designs. ADR benchmarking against top-quartile comps, comp-set differentiator scan, three-band revenue case, and an honest budget read. Senior strategist on every audit. No pitch.',
    canonical: 'https://www.soraiadesigns.com/audit',
    ogTitle: 'Free STR Property Audit | Soraia Designs',
    ogDescription:
      'Free STR property audit — ADR benchmarking, comp-set scan, three-band revenue case, honest budget read. Senior strategist on every audit.',
    ogUrl: 'https://www.soraiadesigns.com/audit',
    robots: 'index, follow',
  },
  {
    path: 'audit/get-started',
    title: 'Request Your Free STR Property Audit | Soraia Designs',
    description:
      'Tell us about your STR property. We pull comps, audit your listing, and deliver a written report in 5 business days. Senior strategist on every audit.',
    canonical: 'https://www.soraiadesigns.com/audit/get-started',
    ogTitle: 'Request Your Free STR Property Audit | Soraia Designs',
    ogDescription:
      'Request a free STR property audit. Senior strategist reviews your listing, comps, and design through an investor lens.',
    ogUrl: 'https://www.soraiadesigns.com/audit/get-started',
    robots: 'noindex, nofollow',
  },
  {
    path: 'audit/requested',
    title: 'Audit Requested — Soraia Designs',
    description:
      'Your STR property audit is in motion. A senior strategist is starting on your property today. Expect your written audit within 5 business days.',
    canonical: 'https://www.soraiadesigns.com/audit/requested',
    ogTitle: 'Audit Requested — Soraia Designs',
    ogDescription: 'Your STR property audit is in motion. Expect your written report within 5 business days.',
    ogUrl: 'https://www.soraiadesigns.com/audit/requested',
    robots: 'noindex, nofollow',
  },
]

for (const route of routes) {
  let html = baseHtml

  // title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)

  // meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${route.description}"`
  )

  // canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${route.canonical}"`
  )

  // robots
  html = html.replace(
    /<meta name="robots" content="[^"]*"/,
    `<meta name="robots" content="${route.robots}"`
  )

  // og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${route.ogTitle}"`
  )

  // og:description
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${route.ogDescription}"`
  )

  // og:url
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${route.ogUrl}"`
  )

  const outDir = join(distDir, route.path)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'index.html'), html, 'utf8')
  console.log(`✓ dist/${route.path}/index.html`)
}

console.log('Route HTML generation complete.')
