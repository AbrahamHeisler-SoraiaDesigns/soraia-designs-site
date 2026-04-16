import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Custom prerender plugin — renders the SPA with Puppeteer at build time
// and injects the rendered HTML into the output so crawlers see real content
function prerenderPlugin() {
  return {
    name: 'prerender',
    async closeBundle() {
      const puppeteer = await import('puppeteer')
      const { readFileSync, writeFileSync } = await import('fs')
      const { createServer } = await import('vite')

      // Start a temporary server to serve the built files
      const server = await createServer({
        root: resolve('dist'),
        server: { port: 4567 },
        preview: { port: 4567 },
      })
      const preview = await server.preview()

      try {
        const browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        const page = await browser.newPage()

        // Navigate to the built site and wait for content to render
        await page.goto('http://localhost:4567/', {
          waitUntil: 'networkidle0',
          timeout: 30000,
        })

        // Wait a bit more for framer-motion animations to settle
        await page.waitForSelector('main', { timeout: 10000 })
        await new Promise(r => setTimeout(r, 2000))

        // Get the rendered HTML content inside <div id="root">
        const renderedContent = await page.evaluate(() => {
          return document.getElementById('root').innerHTML
        })

        await browser.close()

        // Read the original dist/index.html and inject the pre-rendered content
        const indexPath = resolve('dist', 'index.html')
        let html = readFileSync(indexPath, 'utf-8')
        html = html.replace(
          '<div id="root"></div>',
          `<div id="root">${renderedContent}</div>`
        )

        writeFileSync(indexPath, html)
        console.log('✅ Pre-rendered HTML injected into dist/index.html')
      } catch (err) {
        console.error('⚠️  Pre-render failed (site will still work as SPA):', err.message)
      } finally {
        preview.close()
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), prerenderPlugin()],
})
