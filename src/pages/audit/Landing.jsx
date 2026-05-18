import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import AuditNav from '../../components/AuditNav'
import Footer from '../../components/Footer'
import { featuredProperties, R2_BASE } from '../../data/properties'
import { testimonials } from '../../data/testimonials'

const heroBgImage = `${R2_BASE}131-web-or-mls-Lets%20Go%20Click-054.jpeg`
const executionBgImage = `${R2_BASE}138-web-or-mls-Lets%20Go%20Click-047.jpeg`
const ctaBgImage = `${R2_BASE}106-web-or-mls-Lets%20Go%20Click-081.jpeg`

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
}

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const pillars = [
  {
    n: '01',
    title: 'ADR + RevPAR benchmark',
    body: 'We benchmark your current ADR and RevPAR against the top quartile of your submarket comps (pulled from Airbtics). You see exactly where you sit and what the ceiling looks like.',
  },
  {
    n: '02',
    title: 'Listing visibility audit',
    body: 'The first 4 photos and your title carry 80% of the click decision. We show you which signals you\'re sending and where they\'re costing you.',
  },
  {
    n: '03',
    title: 'Design-to-revenue gap analysis',
    body: 'We map the design gaps that are most likely depressing your nightly rate — ranked by ROI, not by what looks "nicer."',
  },
  {
    n: '04',
    title: 'Forced-equity opportunities',
    body: 'The upgrades that move both your nightly rate AND your appraised value, so you can refinance into the next acquisition without bringing fresh cash to the table.',
  },
  {
    n: '05',
    title: 'Capital-allocation roadmap',
    body: 'A prioritized list of investments with rough cost ranges and expected payback windows. You\'ll know what to do first, what can wait, and what isn\'t worth doing at all.',
  },
  {
    n: '06',
    title: 'Exit-positioning notes',
    body: 'How to set the property up to sell as a performing business with a documented design system — not just a furnished house. The premium investors leave on the table at sale ranges 15–25% in our experience; this section maps where yours might land.',
  },
]

const painPoints = [
  {
    title: 'ADR Below Market',
    body: 'Most STR investors price 15–30% below their submarket\'s top quartile because their listing reads like a rental, not an asset.',
    cite: 'AirDNA Q4 2025 market reports.',
  },
  {
    title: 'Occupancy Decay',
    body: 'Properties past 18 months on-platform see steady occupancy drift as competing supply enters and design fatigue sets in. The fix is rarely the listing — it\'s the photos behind it.',
  },
  {
    title: 'Appraisal-Blind Design',
    body: 'Most STR design ignores how the property will appraise. That kills your refinance options and your exit multiple before either decision shows up on the calendar.',
  },
]

export default function AuditLanding() {
  useEffect(() => {
    document.title = 'Free STR Property Audit | Soraia Designs'
  }, [])

  return (
    <div className="bg-ivory">
      <AuditNav />

      <main className="pt-20">
        {/* HERO — bg image with dark overlay */}
        <section
          className="relative px-6 lg:px-12 pt-32 pb-32 lg:pt-44 lg:pb-44 overflow-hidden"
          style={{
            backgroundImage: `url(${heroBgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay for text legibility */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(13,13,13,0.55) 0%, rgba(13,13,13,0.70) 100%)',
            }}
          />
          <div className="relative max-w-5xl mx-auto">
            <Reveal>
              <p className="section-label text-stone/80 mb-6">Free STR Property Audit</p>
            </Reveal>
            <Reveal delay={1}>
              <h1
                className="font-serif text-ivory mb-8"
                style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 400, lineHeight: 1.1 }}
              >
                The audit your <em className="not-italic font-medium">property's revenue model</em> has been waiting for.
              </h1>
            </Reveal>
            <Reveal delay={2}>
              <p
                className="font-sans text-stone/90 max-w-3xl leading-relaxed mb-10"
                style={{ fontSize: 'clamp(17px, 1.4vw, 20px)' }}
              >
                A senior strategist reviews your listing, comps, and design through an investor's lens — and shows you exactly where your nightly rate, appraisal value, and exit premium can move. Cash flow now, appraisal lift next, exit premium long. No pitch, no template, just the report.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <div className="flex flex-wrap gap-4 items-center">
                <Link
                  to="/audit/get-started"
                  className="font-sans text-xs font-medium tracking-widest uppercase px-8 py-4 bg-ivory text-charcoal hover:bg-brass hover:text-ivory transition-all duration-300"
                >
                  Get My Free Audit ↓
                </Link>
                <a
                  href="#whats-inside"
                  className="font-sans text-xs font-medium tracking-widest uppercase px-6 py-4 text-ivory border-b border-ivory hover:text-brass hover:border-brass transition-all duration-300"
                >
                  What's inside
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* PAIN POINTS — Charcoal band */}
        <section className="px-6 lg:px-12 py-20 bg-charcoal">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
              {painPoints.map((p, i) => (
                <Reveal key={p.title} delay={i}>
                  <p className="section-label text-ivory/70 mb-4">0{i + 1}</p>
                  <h3
                    className="font-serif text-ivory mb-4"
                    style={{ fontSize: 'clamp(22px, 2vw, 28px)', fontWeight: 500 }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="font-sans text-ivory/85 leading-relaxed"
                    style={{ fontSize: 16 }}
                  >
                    {p.body}
                    {p.cite && (
                      <span className="block mt-2 text-ivory/55 italic" style={{ fontSize: 13 }}>
                        Source: {p.cite}
                      </span>
                    )}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT'S INSIDE */}
        <section id="whats-inside" className="px-6 lg:px-12 py-24 lg:py-32 bg-ivory">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <p className="section-label mb-4">What's inside</p>
            </Reveal>
            <Reveal delay={1}>
              <h2
                className="font-serif text-charcoal mb-6"
                style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400 }}
              >
                Your free <em className="not-italic font-medium">STR property audit</em>.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p
                className="font-sans text-mid-charcoal max-w-3xl leading-relaxed mb-16"
                style={{ fontSize: 18 }}
              >
                We pull your comps, audit your listing through a guest's eyes and an investor's spreadsheet, and hand you a written plan you could give to any contractor or designer. The audit is yours — whether or not we ever work together.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {pillars.map((pillar, i) => (
                <Reveal key={pillar.n} delay={i}>
                  <div className="border-l-2 border-brass pl-6 h-full">
                    <p className="font-sans text-brass tracking-widest mb-3" style={{ fontSize: 12 }}>
                      {pillar.n}
                    </p>
                    <h3
                      className="font-serif text-charcoal mb-3"
                      style={{ fontSize: 22, fontWeight: 500 }}
                    >
                      {pillar.title}
                    </h3>
                    <p
                      className="font-sans text-mid-charcoal leading-relaxed"
                      style={{ fontSize: 15 }}
                    >
                      {pillar.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* CTA card — Warm Stone */}
            <Reveal delay={3}>
              <div className="mt-20 p-10 lg:p-14 bg-stone text-center">
                <h3
                  className="font-serif text-charcoal mb-4"
                  style={{ fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 500 }}
                >
                  Free. No pitch. No template.
                </h3>
                <p
                  className="font-sans text-charcoal/80 max-w-2xl mx-auto mb-8 leading-relaxed"
                  style={{ fontSize: 17 }}
                >
                  This is a real audit by a real designer. If we're not the right fit, you still walk away with the report. Yours to keep.
                </p>
                <Link
                  to="/audit/get-started"
                  className="inline-block font-sans text-xs font-medium tracking-widest uppercase px-8 py-4 bg-charcoal text-ivory hover:bg-brass transition-all duration-300"
                >
                  Get My Free Audit →
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* AUDIT-TO-EXECUTION GAP — bg image with dark overlay */}
        <section
          className="relative px-6 lg:px-12 py-24 lg:py-32 overflow-hidden"
          style={{
            backgroundImage: `url(${executionBgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: 'rgba(13,13,13,0.78)' }}
          />
          <div className="relative max-w-4xl mx-auto">
            <Reveal>
              <p className="section-label text-stone/60 mb-4">What an audit can't do</p>
            </Reveal>
            <Reveal delay={1}>
              <h2
                className="font-serif text-ivory mb-8"
                style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 400 }}
              >
                The audit shows you the <em className="not-italic font-medium">what</em>. Execution is the harder part.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <div className="space-y-6 font-sans text-stone/85 leading-relaxed" style={{ fontSize: 17 }}>
                <p>
                  The audit will give you a clear plan. That's the easy part. The harder part — the part most STR investors underestimate — is sourcing the right pieces, coordinating delivery against a contractor's schedule, managing an out-of-state install, and not blowing the budget on the way.
                </p>
                <p>
                  We don't write the audit and walk away. If you decide the plan is worth executing, our Tier 3 service handles design + procurement + install coordination as one package. You don't manage three vendors. You don't track shipments. You don't reconcile FF&E receipts. We do.
                </p>
                <p>
                  What we <em>don't</em> do: on-site supervision, construction management, permits, or contractor work supervision. That's a hard scope discipline — investors hire general contractors for general-contractor work. We hire ourselves for design + procurement + install coordination. The wedge is honest pricing for what we actually own.
                </p>
              </div>
            </Reveal>
            <Reveal delay={3}>
              <p className="mt-10 font-sans text-stone/70" style={{ fontSize: 16 }}>
                Want the audit first? <Link to="/audit/get-started" className="text-brass underline hover:text-ivory transition-colors">Get it free below.</Link>{' '}
                Want to talk execution now?{' '}
                <a
                  href="https://calendly.com/soraiadesigns/str-consult"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brass underline hover:text-ivory transition-colors"
                >
                  Book a 30-min strategy call
                </a>
                .
              </p>
            </Reveal>
          </div>
        </section>

        {/* WHO RUNS THIS */}
        <section className="px-6 lg:px-12 py-24 lg:py-32 bg-ivory">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <p className="section-label mb-4">Who runs this</p>
            </Reveal>
            <Reveal delay={1}>
              <h2
                className="font-serif text-charcoal mb-8"
                style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 400 }}
              >
                The audit comes from <em className="not-italic font-medium">a real designer</em>, not a template.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p
                className="font-sans text-mid-charcoal leading-relaxed mb-6"
                style={{ fontSize: 18 }}
              >
                Soraia Heisler leads Soraia Designs, a virtual STR design strategy firm working with equity-focused investors across Miami, Tampa, Blue Ridge, and the Poconos. Design decisions are grounded in market data, not personal taste. Every audit gets her eyes — and a senior strategist's read on your submarket — before it lands in your inbox.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <p
                className="font-sans text-mid-charcoal/75 italic"
                style={{ fontSize: 16 }}
              >
                Built for STR owners with 2+ properties thinking about the next refinance, the next acquisition, or the eventual sale.
              </p>
            </Reveal>
            <Reveal delay={4}>
              <p
                className="mt-12 font-sans text-mid-charcoal/65 italic border-l-2 border-brass pl-6"
                style={{ fontSize: 15 }}
              >
                We don't post stats we can't source. The audit will give you ranges grounded in your actual comps — not someone else's average.
              </p>
            </Reveal>
          </div>
        </section>

        {/* PORTFOLIO */}
        <section className="px-6 lg:px-12 py-24 lg:py-32 bg-ivory border-t border-stone/40">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <p className="section-label mb-4">Recent work</p>
            </Reveal>
            <Reveal delay={1}>
              <h2
                className="font-serif text-charcoal mb-6"
                style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 400 }}
              >
                Designed to <em className="not-italic font-medium">perform</em>, not just photograph.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p
                className="font-sans text-mid-charcoal max-w-2xl leading-relaxed mb-12"
                style={{ fontSize: 17 }}
              >
                Five live listings. Click any one to see the property, the listing copy, and the reviews. The audit reads your property the same way these were read.
              </p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredProperties.map((p, i) => (
                <Reveal key={p.href} delay={i}>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-5 py-4 flex items-center justify-between gap-3 border-t border-stone/30">
                      <div>
                        <p
                          className="font-serif text-charcoal group-hover:text-brass transition-colors duration-200"
                          style={{ fontSize: 17, fontWeight: 500 }}
                        >
                          {p.name}
                        </p>
                        <p className="font-sans text-stone/70 mt-0.5" style={{ fontSize: 12, letterSpacing: '0.04em' }}>
                          {p.location}
                        </p>
                      </div>
                      <span className="font-sans text-brass text-lg flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true">
                        →
                      </span>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS — no photos per Maya */}
        <section className="px-6 lg:px-12 py-24" style={{ backgroundColor: '#0D0D0D' }}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <p className="section-label text-stone/60 mb-4">What clients say</p>
            </Reveal>
            <Reveal delay={1}>
              <h2
                className="font-serif text-ivory mb-12"
                style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 400 }}
              >
                <em className="not-italic font-medium">Real reviews</em>, real properties, real returns.
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i}>
                  <div
                    className="border border-stone/20 p-8 h-full flex flex-col gap-6"
                    style={{ backgroundColor: '#161616' }}
                  >
                    <span className="brass-rule w-8 block" />
                    <blockquote>
                      <p
                        className="font-serif italic text-stone leading-relaxed"
                        style={{ fontSize: 18, fontWeight: 400 }}
                      >
                        "{t.quote}"
                      </p>
                    </blockquote>
                    <div className="mt-auto">
                      <p className="font-sans font-medium text-ivory" style={{ fontSize: 14 }}>{t.name}</p>
                      <p className="font-sans text-stone/60" style={{ fontSize: 13 }}>{t.type}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA → form page — bg image with dark overlay */}
        <section
          className="relative px-6 lg:px-12 py-24 lg:py-32 overflow-hidden"
          style={{
            backgroundImage: `url(${ctaBgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: 'rgba(13,13,13,0.72)' }}
          />
          <div className="relative max-w-3xl mx-auto text-center">
            <Reveal>
              <p className="section-label text-stone/80 mb-4">Get the audit</p>
            </Reveal>
            <Reveal delay={1}>
              <h2
                className="font-serif text-ivory mb-6"
                style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400 }}
              >
                Request your free <em className="not-italic font-medium">property audit</em>.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p
                className="font-sans text-stone/90 mb-10 leading-relaxed"
                style={{ fontSize: 17 }}
              >
                Tell us about the property. We'll pull comps, audit the listing, and have your written report back inside 5 business days. Senior strategist on every audit — no auto-generated reports.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <Link
                to="/audit/get-started"
                className="inline-block font-sans text-xs font-medium tracking-widest uppercase px-10 py-4 bg-ivory text-charcoal hover:bg-brass hover:text-ivory transition-all duration-300"
              >
                Get My Free Audit →
              </Link>
            </Reveal>
            <Reveal delay={4}>
              <p className="mt-6 font-sans text-stone/65" style={{ fontSize: 13 }}>
                Your information is kept confidential. We never share, sell, or syndicate your property data.
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
