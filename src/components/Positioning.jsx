import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function Positioning() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="positioning" className="bg-ivory py-24 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto text-center" ref={ref}>
        {/* Top brass rule */}
        <motion.div
          className="flex items-center gap-6 justify-center mb-12"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={inView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ originX: 0.5 }}
        >
          <span className="brass-rule flex-1 max-w-24" />
          <span className="w-1.5 h-1.5 bg-brass rounded-full flex-shrink-0" />
          <span className="brass-rule flex-1 max-w-24" />
        </motion.div>

        {/* Pull quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p
            className="font-serif italic text-charcoal leading-snug mb-8"
            style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 400 }}
          >
            "Design is not decoration. In STRs, it affects how your property photographs,
            competes, and is perceived by every guest who scrolls past your listing."
          </p>
        </motion.blockquote>

        {/* Subline */}
        <motion.p
          className="font-sans text-mid-charcoal"
          style={{ fontSize: 17, fontWeight: 400 }}
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          We design for owners who care about returns — not just style.
        </motion.p>

        {/* Bottom brass rule */}
        <motion.div
          className="flex items-center gap-6 justify-center mt-12"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={inView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          style={{ originX: 0.5 }}
        >
          <span className="brass-rule flex-1 max-w-24" />
          <span className="w-1.5 h-1.5 bg-brass rounded-full flex-shrink-0" />
          <span className="brass-rule flex-1 max-w-24" />
        </motion.div>
      </div>
    </section>
  )
}
