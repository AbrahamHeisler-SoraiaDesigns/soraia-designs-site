import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const testimonials = [
  {
    quote:
      "Incredible attention to detail. Every element flows together, creating a cohesive, immersive experience from start to finish.",
    name: 'Katie',
    type: 'STR Owner',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    quote:
      "We weren't sure how bookings would go at first, but it's been nonstop — back-to-back stays and up to $20,000/month in peak season.",
    name: 'Scott',
    type: 'STR Investor',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    quote:
      "Soraia completely transformed our Bradenton short-term rental into a standout, guest-ready space that looks incredible. She didn't forget a single detail. She understands exactly how to design for Airbnb success—stylish, functional, and built to drive bookings and 5-star experiences.",
    name: 'Rich',
    type: 'STR Portfolio Owner',
    photo: 'https://randomuser.me/api/portraits/men/57.jpg',
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
              {/* Photo */}
              <div className="w-14 h-14 rounded-full overflow-hidden border border-stone/20 flex-shrink-0">
                <img
                  src={t.photo}
                  alt={t.name}
                  className="w-full h-full object-cover"
                />
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
                <p className="font-sans text-stone/60" style={{ fontSize: 13 }}>{t.type}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
