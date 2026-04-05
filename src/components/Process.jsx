import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const steps = [
  {
    num: '01',
    title: 'Strategy Call',
    desc: "We analyze your property, market position, and investment goals before a single design decision is made.",
  },
  {
    num: '02',
    title: 'Design Concept',
    desc: "We develop a cohesive design direction based on your guest avatar, market data, and property constraints.",
  },
  {
    num: '03',
    title: 'Sourcing & Selection',
    desc: "Every item is curated for durability, guest appeal, and value — with a full sourcing list you can act on.",
  },
  {
    num: '04',
    title: 'Delivery & Coordination',
    desc: "We coordinate vendors, track orders, and manage logistics so your project stays on schedule and on budget.",
  },
  {
    num: '05',
    title: 'Launch Ready',
    desc: "Your property is staged, photographed, and optimized for listing — ready to compete from day one.",
  },
]

export default function Process() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="process" className="py-24 px-6 lg:px-12" style={{ backgroundColor: '#1E1C19' }}>
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Heading */}
        <motion.h2
          className="font-serif text-ivory mb-16"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Our Process
        </motion.h2>

        {/* Steps — horizontal on desktop, compact stacked mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-px bg-stone/10 mb-16">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="bg-dark-bg p-6 md:p-6 lg:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
            >
              {/* Number */}
              <span
                className="font-serif text-brass mb-4 block"
                style={{ fontSize: 40, fontWeight: 300, lineHeight: 1 }}
              >
                {step.num}
              </span>
              {/* Title */}
              <h3
                className="font-serif text-ivory mb-3"
                style={{ fontSize: 20, fontWeight: 500 }}
              >
                {step.title}
              </h3>
              {/* Description */}
              <p className="font-sans text-stone/80 leading-relaxed" style={{ fontSize: 14 }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <a
            href="https://calendly.com/soraia-designs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            Book Your Strategy Call
          </a>
        </motion.div>
      </div>
    </section>
  )
}
