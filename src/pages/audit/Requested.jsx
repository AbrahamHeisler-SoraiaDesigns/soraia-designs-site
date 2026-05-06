import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuditNav from '../../components/AuditNav'
import Footer from '../../components/Footer'

const steps = [
  {
    n: '01',
    title: 'We pull your comps',
    body: 'Submarket data from Airbtics, top-quartile ADR/occupancy benchmarks, supply-side competitive read.',
  },
  {
    n: '02',
    title: 'A senior strategist audits the property',
    body: 'Listing photos, title, design-to-revenue gaps, forced-equity opportunities, exit positioning.',
  },
  {
    n: '03',
    title: 'You get the report inside 5 business days',
    body: 'PDF in your inbox, yours to keep.',
  },
  {
    n: '04',
    title: 'Optional: 30-min strategy call',
    body: 'If you want to walk through it together, book the call. If not, no follow-up pressure.',
  },
]

export default function AuditRequested() {
  useEffect(() => {
    document.title = 'Audit Requested | Soraia Designs'
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', { value: 0, currency: 'USD' })
    }
  }, [])

  return (
    <div className="bg-ivory min-h-screen">
      <AuditNav />

      <main className="pt-20">
        {/* Confirmation hero */}
        <section className="px-6 lg:px-12 pt-16 lg:pt-24 pb-12">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-8 rounded-full bg-stone flex items-center justify-center"
              aria-hidden="true"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8A9E8C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="font-serif text-charcoal mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 400 }}
            >
              Your audit is <em className="not-italic font-medium">in motion</em>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="font-sans text-mid-charcoal mb-4 leading-relaxed"
              style={{ fontSize: 18 }}
            >
              Thanks for the request. A senior strategist is starting on your property today. Expect your written audit in your inbox within 5 business days.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="font-sans text-mid-charcoal/75 leading-relaxed"
              style={{ fontSize: 16 }}
            >
              We'll cover ADR + RevPAR benchmarking, listing visibility, design-to-revenue gaps, forced-equity opportunities, and a prioritized capital-allocation roadmap — written specifically for your property.
            </motion.p>
          </div>
        </section>

        {/* What happens next */}
        <section className="px-6 lg:px-12 py-16 lg:py-20 bg-ivory border-t border-stone/40">
          <div className="max-w-4xl mx-auto">
            <p className="section-label mb-4">What happens next</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {steps.map((s) => (
                <div key={s.n} className="border-l-2 border-brass pl-6">
                  <p className="font-sans text-brass tracking-widest mb-2" style={{ fontSize: 12 }}>{s.n}</p>
                  <h3 className="font-serif text-charcoal mb-2" style={{ fontSize: 20, fontWeight: 500 }}>
                    {s.title}
                  </h3>
                  <p className="font-sans text-mid-charcoal leading-relaxed" style={{ fontSize: 15 }}>
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calendly inline */}
        <section className="px-6 lg:px-12 py-16 lg:py-24" style={{ backgroundColor: '#0D0D0D' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="section-label text-stone/60 mb-4">Skip the wait</p>
              <h2
                className="font-serif text-ivory mb-6"
                style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 400 }}
              >
                Book your strategy call <em className="not-italic font-medium">now</em>.
              </h2>
              <p className="font-sans text-stone/75 max-w-2xl mx-auto leading-relaxed" style={{ fontSize: 16 }}>
                If you'd rather walk through your audit together when it's ready, lock in a 30-minute strategy call now. Calendar fills up first.
              </p>
            </div>
            <div className="bg-ivory" style={{ minHeight: 720 }}>
              <iframe
                title="Book a 30-min strategy call with Abe"
                src="https://calendly.com/abe-soraiadesigns/30min?hide_gdpr_banner=1"
                width="100%"
                height="720"
                frameBorder="0"
                loading="lazy"
              />
            </div>
            <div className="text-center mt-8">
              <Link
                to="/"
                className="font-sans text-xs font-medium tracking-widest uppercase text-stone/70 hover:text-brass transition-colors"
              >
                ← Back to Soraia Designs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
