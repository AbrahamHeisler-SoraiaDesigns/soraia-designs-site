import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function Positioning() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="positioning" className="relative py-32 px-6 lg:px-12 overflow-hidden">
      {/* Background photo */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src="https://pub-b732a2cfd217455192c17bafa7883c05.r2.dev/13-web-or-mls-Lets%20Go%20Click-013.jpg"
          alt=""
          className="w-full h-full object-cover object-center"
        />
        {/* Dark gradient overlay — heavier at centre for text legibility */}
        <div className="absolute inset-0" style={{ background: 'rgba(22,22,22,0.72)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center" ref={ref}>
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
            className="font-serif italic text-ivory leading-snug mb-8"
            style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 400 }}
          >
            "Design is not decoration. In STRs, it affects how your property photographs,
            competes, and is perceived by every guest who scrolls past your listing."
          </p>
        </motion.blockquote>

        {/* Subline */}
        <motion.p
          className="font-sans text-stone"
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
