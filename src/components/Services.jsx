import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const services = [
  {
    title: 'Strategy Consultation',
    description:
      'A focused, data-driven assessment of your property and market. Includes market analysis, guest avatar definition, and amenity stack guidance — so every design decision is grounded in what actually converts.',
    bullets: [
      'Market performance analysis',
      'Guest behavior and avatar mapping',
      'Amenity stack recommendations',
      'Scope and budget clarity',
    ],
    cta: 'Book Your Strategy Call',
    ctaHref: 'https://calendly.com/soraia-designs',
  },
  {
    title: 'Full STR Design Package',
    description:
      'End-to-end design direction for your property. From concept to curated sourcing list — every room planned with guest experience and investment performance in mind.',
    bullets: [
      'Concept development and design direction',
      'Room-by-room layout recommendations',
      'Curated sourcing list with vendor guidance',
      'Procurement coordination support',
    ],
    cta: 'Get Started',
    ctaHref: 'https://calendly.com/soraia-designs',
  },
  {
    title: 'Procurement Support',
    description:
      'Add-on service for owners who want hands-off coordination. We manage vendors, track orders, and keep your project on budget so you don\'t have to.',
    bullets: [
      'Vendor coordination and communication',
      'Order tracking and delivery management',
      'Budget oversight and reconciliation',
      'Issue resolution and substitutions',
    ],
    cta: 'Learn More',
    ctaHref: 'https://calendly.com/soraia-designs',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: 'easeOut' },
  }),
}

export default function Services() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="services" className="bg-ivory py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Label */}
        <motion.p
          className="section-label mb-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          Services
        </motion.p>

        {/* Heading */}
        <motion.h2
          className="font-serif text-charcoal mb-16"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          How We Work
        </motion.h2>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="bg-white border border-stone flex flex-col"
              style={{
                borderTop: '3px solid #B8975A',
                boxShadow: '0 4px 20px rgba(44,42,39,0.07)',
              }}
            >
              <div className="p-8 flex flex-col flex-1">
                <h3
                  className="font-serif text-charcoal mb-4"
                  style={{ fontSize: 26, fontWeight: 500 }}
                >
                  {service.title}
                </h3>
                <p className="font-sans text-mid-charcoal leading-relaxed mb-6" style={{ fontSize: 15 }}>
                  {service.description}
                </p>
                <ul className="space-y-2 mb-8 flex-1">
                  {service.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="text-brass text-sm mt-0.5 flex-shrink-0">—</span>
                      <span className="font-sans text-charcoal" style={{ fontSize: 14 }}>{b}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={service.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-center block"
                >
                  {service.cta}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
