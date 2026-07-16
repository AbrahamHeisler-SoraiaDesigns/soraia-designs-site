import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Footer from '../components/Footer'

// Canonical event — str-consult (NOT the dead abe-soraiadesigns/30min).
const CALENDLY_URL = 'https://calendly.com/soraiadesigns/str-consult'
const CAL_CSS = 'https://assets.calendly.com/assets/external/widget.css'
const CAL_JS = 'https://assets.calendly.com/assets/external/widget.js'

/**
 * On-site booking page. The booking happens on our domain so:
 *  - Meta sees a `Schedule` conversion (fbclid cookied here, not lost on the
 *    calendly.com hop), and cost-per-booked-call becomes readable for R1.
 *  - /book visitors feed the Website Visitors 180d retargeting audience.
 *
 * Uses Calendly's JS API (initInlineWidget) — not the plain HTML embed — so we
 * can forward the page's UTMs into the widget and listen for the booking event.
 */
export default function Book() {
  const widgetRef = useRef(null)
  // Content-blocker / load-failure fallback. A meaningful slice of ad traffic
  // runs blockers that kill Calendly's CDN — without this, those visitors hit a
  // blank booking page. On failure we surface a direct link that still carries
  // the UTMs, so a blocked visitor books (attribution via Calendly->HubSpot;
  // the on-domain Schedule pixel is the only thing lost on that degraded path).
  const [calendlyBlocked, setCalendlyBlocked] = useState(false)
  const [fallbackHref, setFallbackHref] = useState(CALENDLY_URL)

  useEffect(() => {
    document.title = 'Book a Call | Soraia Designs'

    // Forward the page's UTMs into Calendly. The Calendly-UTM -> HubSpot join is
    // how bookings attribute; if the embed swallows these, R1 attribution dies.
    // Drop absent keys: Calendly serializes an `undefined` value as the literal
    // string "undefined", which would land as utm_term=undefined in HubSpot.
    const qs = new URLSearchParams(window.location.search)
    const utm = Object.fromEntries(
      Object.entries({
        utmSource: qs.get('utm_source'),
        utmMedium: qs.get('utm_medium'),
        utmCampaign: qs.get('utm_campaign'),
        utmContent: qs.get('utm_content'),
        utmTerm: qs.get('utm_term'),
      }).filter(([, v]) => v)
    )

    // Preserve UTM attribution on the fallback direct link too.
    const passUtms = new URLSearchParams()
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = qs.get(k)
      if (v) passUtms.set(k, v)
    }
    setFallbackHref(passUtms.toString() ? `${CALENDLY_URL}?${passUtms}` : CALENDLY_URL)

    if (!document.querySelector(`link[href="${CAL_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = CAL_CSS
      document.head.appendChild(link)
    }
    if (!document.querySelector(`script[src="${CAL_JS}"]`)) {
      const script = document.createElement('script')
      script.src = CAL_JS
      script.async = true
      document.body.appendChild(script)
    }

    let cancelled = false
    // Poll for the Calendly global rather than binding the script's `load` event.
    // The load event is racy under React StrictMode (double-invoked effect: the
    // second pass finds an already-loaded script and its listener never fires),
    // which left the widget uninitialized. Polling is robust to that.
    const tryInit = () => {
      if (cancelled || !window.Calendly || !widgetRef.current) return false
      widgetRef.current.innerHTML = '' // guard double-init
      window.Calendly.initInlineWidget({
        url: `${CALENDLY_URL}?hide_gdpr_banner=1`,
        parentElement: widgetRef.current,
        prefill: {},
        utm,
      })
      return true
    }
    let poll
    if (!tryInit()) {
      poll = setInterval(() => {
        if (tryInit() || cancelled) clearInterval(poll)
      }, 100)
    }

    // If Calendly hasn't rendered an iframe within 6s (blocker, network, CDN
    // outage), give up and show the direct-link fallback so the page is never
    // a dead end.
    const failTimer = setTimeout(() => {
      const rendered = widgetRef.current && widgetRef.current.querySelector('iframe')
      if (!cancelled && !rendered) {
        if (poll) clearInterval(poll)
        setCalendlyBlocked(true)
      }
    }, 6000)

    // Fire Meta `Schedule` (NOT Lead — Lead belongs to the /audit form) only on a
    // completed booking. event_id = Calendly event URI so a future CAPI leg dedupes.
    const onMessage = (e) => {
      if (e.origin !== 'https://calendly.com') return
      if (!e.data || typeof e.data.event !== 'string') return
      if (e.data.event === 'calendly.event_scheduled') {
        const uri = e.data.payload?.event?.uri || `booking-${Date.now()}`
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Schedule', {}, { eventID: uri })
        }
      }
    }
    window.addEventListener('message', onMessage)

    return () => {
      cancelled = true
      if (poll) clearInterval(poll)
      clearTimeout(failTimer)
      window.removeEventListener('message', onMessage)
    }
  }, [])

  return (
    <div className="bg-ivory min-h-screen flex flex-col">
      {/* Minimal, logo-only header — no competing CTA, per the booking-first brief. */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ivory shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center">
          <Link to="/" className="flex-shrink-0" aria-label="Soraia Designs — back to homepage">
            <img
              src="/assets/soraia-designs-logo-transparent.png"
              alt="Soraia Designs"
              className="w-auto"
              style={{ mixBlendMode: 'multiply', height: 80 }}
            />
          </Link>
        </div>
      </header>

      <main className="pt-20 flex-1">
        <section className="px-6 lg:px-12 pt-12 lg:pt-16 pb-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-serif text-charcoal mb-5"
              style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 400 }}
            >
              Book your <em className="not-italic font-medium">15-minute</em> strategy call.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="font-sans text-mid-charcoal leading-relaxed"
              style={{ fontSize: 18 }}
            >
              Pick a time and Abraham will walk through where your property sits in its market, what the top comps are doing, and the revenue math. No pressure, no pitch deck.
            </motion.p>
          </div>
        </section>

        {/* Calendly inline widget. Tall min-heights keep the whole flow visible so
            the iframe never scroll-traps on mobile (known Calendly-embed failure). */}
        <section className="px-4 lg:px-12 pb-16">
          {/* No `calendly-inline-widget` class: widget.js auto-scans for it and
              initializes any match by reading `data-url`. Our div has none (we
              pass the URL via initInlineWidget), so the auto-scan hits
              null.split() and crashes the whole script -> window.Calendly never
              defines -> the embed never renders. Layout classes do all styling. */}
          <div
            ref={widgetRef}
            className={`max-w-3xl mx-auto w-full ${calendlyBlocked ? '' : 'min-h-[1100px] md:min-h-[760px]'}`}
            style={{ minWidth: 320 }}
            data-book-widget
          />
          {calendlyBlocked && (
            <div className="max-w-3xl mx-auto text-center py-16">
              <p className="font-sans text-mid-charcoal mb-6" style={{ fontSize: 17 }}>
                Having trouble loading the scheduler? Book your call directly:
              </p>
              <a
                href={fallbackHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-xs font-medium tracking-widest uppercase px-10 py-4 bg-charcoal text-ivory hover:bg-brass transition-all duration-300 inline-block"
              >
                Book your call →
              </a>
            </div>
          )}
          <noscript>
            <div className="max-w-3xl mx-auto text-center mt-6">
              <a
                href={CALENDLY_URL}
                className="font-sans text-xs font-medium tracking-widest uppercase px-6 py-3 border border-brass text-charcoal inline-block"
              >
                Book your call
              </a>
            </div>
          </noscript>
        </section>
      </main>

      <Footer />
    </div>
  )
}
