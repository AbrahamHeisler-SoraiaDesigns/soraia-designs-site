import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function About() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="about" className="bg-ivory py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Photo placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div
              className="w-full overflow-hidden"
              style={{ aspectRatio: '3/4', maxHeight: 560 }}
            >
              <img
                src="https://pub-b732a2cfd217455192c17bafa7883c05.r2.dev/DSC04377.jpg"
                alt="Soraia Designs — family lifestyle shot with signature flamingo mural"
                className="w-full h-full object-cover object-center"
              />
            </div>
            {/* Brass accent corner */}
            <div
              className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-brass translate-x-4 translate-y-4"
              aria-hidden="true"
            />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="brass-rule w-12 block mb-8" />

            <h2
              className="font-serif text-charcoal mb-6"
              style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 400 }}
            >
              Design expertise grounded in investment thinking.
            </h2>

            <div className="space-y-5 font-sans text-charcoal leading-relaxed" style={{ fontSize: 16 }}>
              <p>
                Soraia brings a background in interior design and a deep understanding of the
                short-term rental market. Every recommendation is shaped by both — design that
                works visually and performs commercially.
              </p>
              <p>
                Working with STR investors means understanding how a property competes in a
                specific market, what guests in that market expect, and how design decisions
                translate into booking performance over time.
              </p>
              <p>
                This isn't about trends. It's about building a property that photographs well,
                earns consistent reviews, and holds its value as the market evolves.
              </p>
            </div>

            <div className="mt-10">
              <a
                href="https://calendly.com/soraia-designs"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Book Your Strategy Call
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
