// GA4 loader. Activates only when VITE_GA4_ID is set at build time (Vercel env),
// so the site ships clean until Abe provides the Measurement ID. Once set, the
// existing window.gtag('event', 'generate_lead') on /audit/requested becomes a
// live conversion with no further code change.
export function initGA4() {
  if (typeof window === 'undefined') return
  const id = import.meta.env.VITE_GA4_ID
  if (!id) return
  if (window.__ga4_loaded) return
  window.__ga4_loaded = true

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(s)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', id)
}
