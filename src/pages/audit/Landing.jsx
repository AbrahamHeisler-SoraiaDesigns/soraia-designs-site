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
    title: 'Executive diagnosis + audit score',
    body: 'Where your property sits in its design lane, what your audit score is (weighted blend of rating, sub-rating gaps, comp-set positioning, design-lane clarity), and which review themes are telling the real story. The pattern your reviews actually surface — not the one Airbnb shows you.',
  },
  {
    n: '02',
    title: 'Market position vs. comps',
    body: 'ADR + RevPAR benchmark against the top quartile of your submarket (pulled from Airbtics). You see exactly where you sit, what the median earns, and where the ceiling lands for your bed/bath profile.',
  },
  {
    n: '03',
    title: 'Comp-set differentiator scan',
    body: '6–8 named comps in your catchment with estimated ADRs, plus the three patterns the top earners use to charge $60–$100 more per night than the market median. Specific, with sources — not generic best-practice advice.',
  },
  {
    n: '04',
    title: 'Revenue case + recommended path + budget reality',
    body: 'Three rate-band scenarios with annual revenue deltas, two implementation paths (strategic refresh vs. top-performer push) with realistic budget ranges, and the part most audits dodge — what each budget level can and cannot actually do for your property.',
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
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    setMeta(
      'description',
      'Get a free STR property audit from Soraia Designs. ADR benchmarking against top-quartile comps, comp-set differentiator scan, three-band revenue case, and an honest budget read. Senior strategist on every audit. No pitch.'
    )
    setMeta(
      'keywords',
      'STR property audit, short-term rental audit, Airbnb ADR optimization, vacation rental design audit, STR comp analysis, STR investor design, STR revenue audit'
    )
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
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

            <Reveal delay={4}>
              <p
                className="font-sans italic text-mid-charcoal/75 max-w-3xl mt-12 leading-relaxed"
                style={{ fontSize: 15 }}
              >
                Forced-equity strategy and exit positioning are covered in the post-audit strategy session, not the written audit. The audit gives you the read; the session walks the refi/exit math against your actual numbers.
              </p>
            </Reveal>

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
          </div>
        </section>

        {/* PROOF BAND */}
        <section id="proof" className="px-6 lg:px-12 py-24 lg:py-32 bg-ivory border-t border-stone/40">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <p className="section-label mb-4">Documented results</p>
            </Reveal>
            <Reveal delay={1}>
              <h2
                className="font-serif text-charcoal mb-6"
                style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 400 }}
              >
                We don't post stats we can't source. Here are two <em className="not-italic font-medium">we can</em>.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p
                className="font-sans text-mid-charcoal max-w-3xl leading-relaxed mb-16"
                style={{ fontSize: 18 }}
              >
                Two properties we've designed, with the operating data their owners signed off on. One sat on a ~$60K market average and now earns $200K+ a year — a 1.7×–2.2× lift measured against its nearest comparable homes, not a market-wide average. The other is on a stretch-case trajectory beyond 6× on a property built for top-of-comp pricing power.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* B727 — realized lift */}
              <Reveal delay={2}>
                <div className="bg-charcoal p-8 lg:p-10 h-full flex flex-col gap-6">
                  <div>
                    <p className="section-label text-brass mb-2">Bungalow 727 · Madeira Beach, FL</p>
                    <p className="font-sans text-stone/60 tracking-widest mb-6" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      4 years operating · realized lift
                    </p>
                  </div>
                  <div className="space-y-0 flex-1 divide-y divide-stone/15">
                    <div className="flex justify-between items-baseline py-3">
                      <span className="font-sans text-stone/75 text-sm">Market average (dollar story)</span>
                      <span className="font-sans text-ivory font-medium text-sm">~$60K / yr</span>
                    </div>
                    <div className="flex justify-between items-baseline py-3">
                      <span className="font-sans text-stone/75 text-sm">Current annual revenue</span>
                      <span className="font-sans text-ivory font-medium text-sm">$200K–$250K</span>
                    </div>
                    <div className="flex justify-between items-baseline py-3">
                      <span className="font-sans text-stone/55 text-xs leading-snug max-w-[200px]">Cohort baseline — 25th pct, 40 nearest 4BR comps, same ZIP</span>
                      <span className="font-sans text-stone/55 text-xs">$115K / yr</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="font-sans text-stone/80 text-sm">Lift vs. cohort baseline</span>
                      <span className="font-serif text-brass" style={{ fontSize: 28, fontWeight: 500 }}>1.7×–2.2×</span>
                    </div>
                  </div>
                  <p className="font-sans text-stone/50 leading-relaxed" style={{ fontSize: 12 }}>
                    4 yrs Superhost · Guest Favorite (top 10%) · 25 reviews all 5-star · 4.96/5.0
                  </p>
                  <a
                    href="https://drive.google.com/file/d/1o0jnQ9nl6-8LUvgLEOJECN38HTAEPQBC/view"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans font-medium tracking-widest text-brass hover:text-ivory transition-colors self-start"
                    style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  >
                    Read the full case study (PDF) →
                  </a>
                </div>
              </Reveal>

              {/* Flamingo Sol — trajectory only */}
              <Reveal delay={3}>
                <div className="bg-stone p-8 lg:p-10 h-full flex flex-col gap-6">
                  <div>
                    <p className="section-label text-charcoal/60 mb-2">Flamingo Sol · Bradenton, FL</p>
                    <p className="font-sans text-charcoal/45 tracking-widest mb-6" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Active · early ramp · trajectory
                    </p>
                  </div>
                  <div className="space-y-0 flex-1 divide-y divide-charcoal/12">
                    <div className="flex justify-between items-baseline py-3">
                      <span className="font-sans text-charcoal/65 text-sm">Bradenton market avg (per listing)</span>
                      <span className="font-sans text-charcoal font-medium text-sm">$30.7K / yr</span>
                    </div>
                    <div className="flex justify-between items-baseline py-3">
                      <span className="font-sans text-charcoal/65 text-sm">Flamingo Sol target annual</span>
                      <span className="font-sans text-charcoal font-medium text-sm">$200K</span>
                    </div>
                    <div className="flex justify-between items-baseline py-3">
                      <span className="font-sans text-charcoal/50 text-xs">Pricing power</span>
                      <span className="font-sans text-charcoal/50 text-xs text-right" style={{ maxWidth: 180 }}>
                        $772 off-peak · $1,189 shoulder · $1,993 peak
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                      <span className="font-sans text-charcoal/65 text-sm">Trajectory vs. baseline*</span>
                      <span className="font-serif text-charcoal" style={{ fontSize: 28, fontWeight: 500 }}>~6.5×</span>
                    </div>
                  </div>
                  <p className="font-sans text-charcoal/45 italic leading-relaxed" style={{ fontSize: 12 }}>
                    *Projected — full year not yet ramped. This is a target, not a realized result.
                  </p>
                  <a
                    href="https://drive.google.com/file/d/1C9ZWbOWzSSl-kiyxZOVO7Yh9oYUalwug/view"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans font-medium tracking-widest text-charcoal hover:text-brass transition-colors self-start"
                    style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  >
                    Read the full case study (PDF) →
                  </a>
                </div>
              </Reveal>
            </div>

            <Reveal delay={4}>
              <p
                className="mt-10 font-sans text-mid-charcoal/75 leading-relaxed"
                style={{ fontSize: 15 }}
              >
                Your range depends on your starting point, your market, and how much of the playbook fits your property — which is what the audit tells you.
              </p>
            </Reveal>
            <Reveal delay={4}>
              <p className="mt-2 font-sans text-mid-charcoal/45 italic" style={{ fontSize: 13 }}>
                Reflects one documented project; individual results vary.
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
