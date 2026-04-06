import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const bullets = [
  'Evaluate which property or layout offers the best ROI potential.',
  'Define your project scope, budget, and realistic timeline.',
  'Get clear next steps if you\'re just starting out.',
]

export default function Strategy() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="strategy" className="py-24 px-6 lg:px-12" style={{ backgroundColor: '#0D0D0D' }}>
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="max-w-3xl">
          {/* Label */}
          <motion.p
            className="section-label-dark mb-4"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4 }}
          >
            Strategy First
          </motion.p>

          {/* Heading */}
          <motion.h2
            className="font-serif text-ivory mb-8"
            style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 400 }}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            We start every project with data — not décor.
          </motion.h2>

          {/* Body */}
          <motion.div
            className="space-y-5 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="font-sans text-stone leading-relaxed" style={{ fontSize: 17 }}>
              Our strategy consultation calls deliver clarity, direction, and confidence — whether
              you're ready for a full design or just need expert insight for your next step.
            </p>
            <p className="font-sans text-stone leading-relaxed" style={{ fontSize: 17 }}>
              Each call goes beyond inspiration boards to analyze market performance, guest
              behavior, and investment metrics that drive real returns.
            </p>
            <p className="font-sans text-stone leading-relaxed" style={{ fontSize: 17 }}>
              Use your consultation to:
            </p>
          </motion.div>

          {/* Bullets */}
          <motion.ul
            className="space-y-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="text-brass mt-1 text-lg leading-none flex-shrink-0">•</span>
                <span className="font-sans text-stone leading-relaxed" style={{ fontSize: 16 }}>
                  {item}
                </span>
              </li>
            ))}
          </motion.ul>

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

        {/* Right column — photo */}
        <motion.div
          className="hidden lg:block relative"
          initial={{ opacity: 0, x: 30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
            <img
              src="/assets/strategy-hero.png"
              alt="Vibrant STR bedroom with tropical palm wallpaper and Good Vibes neon signs"
              className="w-full h-full object-cover"
            />
            {/* Brass corner accent */}
            <div
              className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-brass -translate-x-4 translate-y-4"
              aria-hidden="true"
            />
          </div>
        </motion.div>

        </div>
      </div>
    </section>
  )
}
