import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function Investment() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="investment" className="bg-ivory pt-12 pb-24 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto" ref={ref}>
        {/* Brass rule */}
        <motion.span
          className="brass-rule w-12 block mb-8"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={inView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.5 }}
          style={{ originX: 0 }}
        />

        {/* Heading */}
        <motion.h2
          className="font-serif text-charcoal mb-8"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Investment
        </motion.h2>

        {/* Body */}
        <motion.p
          className="font-sans text-charcoal leading-relaxed mb-6"
          style={{ fontSize: 18, fontWeight: 300 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Every project is scoped to your property, goals, and market. Investment starts at{' '}
          <strong className="font-medium">$5,000</strong> for design strategy packages.
        </motion.p>

        <motion.p
          className="font-sans text-mid-charcoal leading-relaxed mb-12"
          style={{ fontSize: 16 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Book a call to discuss your project and get a clear, transparent quote.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <a
            href="https://calendly.com/abe-soraiadesigns/30min"
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
