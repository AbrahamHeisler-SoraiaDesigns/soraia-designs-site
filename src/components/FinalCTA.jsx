import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function FinalCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="final-cta" className="py-32 px-6 lg:px-12" style={{ backgroundColor: '#0D0D0D' }}>
      <div className="max-w-4xl mx-auto text-center" ref={ref}>
        {/* Brass rule */}
        <motion.div
          className="flex items-center gap-6 justify-center mb-12"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="brass-rule flex-1 max-w-16" />
          <span className="w-1.5 h-1.5 bg-brass rounded-full flex-shrink-0" />
          <span className="brass-rule flex-1 max-w-16" />
        </motion.div>

        {/* Headline */}
        <motion.h2
          className="font-serif text-ivory mb-10"
          style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 400 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Ready to make your STR a top performer?
        </motion.h2>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <a
            href="https://calendly.com/soraia-designs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-base px-12 py-5"
          >
            Book Your Strategy Call
          </a>
        </motion.div>
      </div>
    </section>
  )
}
