import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { featuredProperties as properties, galleryImages, R2_BASE as R2 } from '../data/properties'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06 },
  }),
}

export default function Portfolio() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="portfolio" className="bg-ivory pt-24 pb-4 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Label */}
        <motion.p
          className="section-label mb-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          Portfolio
        </motion.p>

        {/* Heading */}
        <motion.h2
          className="font-serif text-charcoal mb-8"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Our Work
        </motion.h2>

        {/* Photo grid — 3 columns, 6 rows */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-20">
          {galleryImages.map((img, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="overflow-hidden group"
              style={{ aspectRatio: '4/3' }}
            >
              <img
                src={`${R2}${img.file}`}
                alt={img.alt}
                loading={i < 6 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </motion.div>
          ))}
        </div>

        {/* Featured Properties */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="section-label mb-4">Featured Properties</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((p, i) => (
              <a
                key={i}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Thumbnail */}
                <div className="overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {/* Info bar */}
                <div className="px-5 py-4 flex items-center justify-between gap-3 border-t border-stone/30">
                  <div>
                    <p
                      className="font-serif text-charcoal group-hover:text-brass transition-colors duration-200"
                      style={{ fontSize: 17, fontWeight: 500 }}
                    >
                      {p.name}
                    </p>
                    <p className="font-sans text-stone/70 mt-0.5" style={{ fontSize: 12, letterSpacing: '0.04em' }}>
                      {p.location}
                    </p>
                  </div>
                  <span
                    className="font-sans text-brass text-lg flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
