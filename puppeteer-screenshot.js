import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'http://localhost:5173'
const OUT_DIR = path.join(__dirname, 'screenshots')

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const SECTIONS = [
  { id: 'hero',          label: 'hero' },
  { id: 'pain-points',   label: 'pain-points' },
  { id: 'strategy',      label: 'strategy' },
  { id: 'positioning',   label: 'positioning' },
  { id: 'services',      label: 'services' },
  { id: 'process',       label: 'process' },
  { id: 'investment',    label: 'investment' },
  { id: 'portfolio',     label: 'portfolio' },
  { id: 'testimonials',  label: 'testimonials' },
  { id: 'about',         label: 'about' },
  { id: 'faq',           label: 'faq' },
  { id: 'final-cta',     label: 'final-cta' },
]

async function capture(page, label, suffix = '') {
  const filename = path.join(OUT_DIR, `${label}${suffix}.png`)
  await page.screenshot({ path: filename, fullPage: false })
  console.log(`  ✓ ${path.relative(__dirname, filename)}`)
}

async function run() {
  console.log('\n📸 Soraia Designs — Puppeteer Screenshot Loop')
  console.log('────────────────────────────────────────────\n')

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    // ── Desktop 1440px full-page ──────────────────────────────────
    console.log('► Desktop (1440px) — full page')
    const desktop = await browser.newPage()
    await desktop.setViewport({ width: 1440, height: 900 })
    await desktop.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise(r => setTimeout(r, 600))

    // Slow scroll to trigger all useInView animations before capturing
    await desktop.evaluate(async () => {
      await new Promise(resolve => {
        const totalHeight = document.body.scrollHeight
        let scrolled = 0
        const step = 400
        const interval = setInterval(() => {
          window.scrollBy(0, step)
          scrolled += step
          if (scrolled >= totalHeight) {
            window.scrollTo(0, 0)
            clearInterval(interval)
            resolve()
          }
        }, 80)
      })
    })
    await new Promise(r => setTimeout(r, 1200)) // allow all staggered animations to complete

    await desktop.screenshot({
      path: path.join(OUT_DIR, 'full-desktop-1440.png'),
      fullPage: true,
    })
    console.log('  ✓ screenshots/full-desktop-1440.png')

    // ── Desktop section-by-section ────────────────────────────────
    console.log('\n► Desktop sections')
    for (const section of SECTIONS) {
      const el = await desktop.$(`#${section.id}`)
      if (el) {
        await el.scrollIntoView()
        await new Promise(r => setTimeout(r, 800))
        await el.screenshot({ path: path.join(OUT_DIR, `section-${section.label}.png`) })
        console.log(`  ✓ screenshots/section-${section.label}.png`)
      } else {
        console.warn(`  ⚠ #${section.id} not found`)
      }
    }

    // ── Mobile 375px full-page ────────────────────────────────────
    console.log('\n► Mobile (375px) — full page')
    const mobile = await browser.newPage()
    await mobile.setViewport({ width: 375, height: 812, isMobile: true, deviceScaleFactor: 2 })
    await mobile.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise(r => setTimeout(r, 600))
    await mobile.evaluate(async () => {
      await new Promise(resolve => {
        const totalHeight = document.body.scrollHeight
        let scrolled = 0
        const interval = setInterval(() => {
          window.scrollBy(0, 300)
          scrolled += 300
          if (scrolled >= totalHeight) { window.scrollTo(0, 0); clearInterval(interval); resolve() }
        }, 80)
      })
    })
    await new Promise(r => setTimeout(r, 1200))
    await mobile.screenshot({
      path: path.join(OUT_DIR, 'full-mobile-375.png'),
      fullPage: true,
    })
    console.log('  ✓ screenshots/full-mobile-375.png')

    // ── Tablet 768px full-page ────────────────────────────────────
    console.log('\n► Tablet (768px) — full page')
    const tablet = await browser.newPage()
    await tablet.setViewport({ width: 768, height: 1024 })
    await tablet.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise(r => setTimeout(r, 600))
    await tablet.evaluate(async () => {
      await new Promise(resolve => {
        const totalHeight = document.body.scrollHeight
        let scrolled = 0
        const interval = setInterval(() => {
          window.scrollBy(0, 350)
          scrolled += 350
          if (scrolled >= totalHeight) { window.scrollTo(0, 0); clearInterval(interval); resolve() }
        }, 80)
      })
    })
    await new Promise(r => setTimeout(r, 1200))
    await tablet.screenshot({
      path: path.join(OUT_DIR, 'full-tablet-768.png'),
      fullPage: true,
    })
    console.log('  ✓ screenshots/full-tablet-768.png')

    console.log(`\n✅ All screenshots saved to ./screenshots/\n`)
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('❌ Screenshot failed:', err.message)
  process.exit(1)
})
