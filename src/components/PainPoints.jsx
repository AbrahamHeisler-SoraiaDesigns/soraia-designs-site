import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const painPoints = [
  "You've spent hours on Pinterest but your property still looks like every other listing.",
  "Your design budget spiraled and you're not sure what you got for it.",
  "You picked furniture online and half of it looks wrong in the space.",
  "Your listing photos don't stand out and your booking rate shows it.",
  "You're managing 15 vendor accounts, 30 deliveries, and zero peace of mind.",
  "You know design matters but you're making decisions based on guesswork.",
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' },
  }),
}

export default function PainPoints() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="pain-points" className="bg-ivory py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Label */}
        <motion.p
          className="section-label mb-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          The Problem
        </motion.p>

        {/* Heading */}
        <motion.h2
          className="font-serif text-charcoal mb-16"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Sound familiar?
        </motion.h2>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {painPoints.map((text, i) => (
            <motion.div
              key={i}
              className="accent-card"
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <p className="font-sans text-charcoal leading-relaxed" style={{ fontSize: 16 }}>
                {text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <a
            href="https://calendly.com/soraia-designs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Book Your Strategy Call
          </a>
        </motion.div>
      </div>
    </section>
  )
}
