import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const testimonials = [
  {
    quote:
      "Working with Soraia Designs changed how I think about my properties. The strategy call alone gave me more clarity than six months of research.",
    name: 'Client Name',
    type: 'STR Investor',
    location: 'City, State',
  },
  {
    quote:
      "I had two properties sitting at average performance. After working through the design strategy, I had a clear roadmap and the confidence to execute it.",
    name: 'Client Name',
    type: 'Short-Term Rental Owner',
    location: 'City, State',
  },
  {
    quote:
      "The procurement coordination saved me so much time. I didn't have to manage a single vendor relationship — everything just showed up and worked.",
    name: 'Client Name',
    type: 'STR Portfolio Owner',
    location: 'City, State',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12 },
  }),
}

export default function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="testimonials" className="py-24 px-6 lg:px-12" style={{ backgroundColor: '#0D0D0D' }}>
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Heading */}
        <motion.h2
          className="font-serif text-ivory mb-16"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          What Clients Say
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="border border-stone/20 p-8 flex flex-col gap-6"
              style={{ backgroundColor: '#161616' }}
            >
              {/* Photo placeholder */}
              <div className="w-12 h-12 rounded-full bg-stone/20 border border-stone/30 flex items-center justify-center flex-shrink-0">
                <span className="font-sans text-xs text-stone/40 select-none">Photo</span>
              </div>

              {/* Quote */}
              <blockquote>
                <p
                  className="font-serif italic text-stone leading-relaxed"
                  style={{ fontSize: 18, fontWeight: 400 }}
                >
                  "{t.quote}"
                </p>
              </blockquote>

              {/* Attribution */}
              <div className="mt-auto">
                <span className="brass-rule w-8 block mb-4" />
                <p className="font-sans font-medium text-ivory" style={{ fontSize: 14 }}>{t.name}</p>
                <p className="font-sans text-stone/60" style={{ fontSize: 13 }}>
                  {t.type} · {t.location}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
