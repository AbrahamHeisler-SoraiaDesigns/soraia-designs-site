import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { featuredProperties as properties, galleryImages, R2_BASE as R2 } from '../data/properties'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: Math.min(i, 8) * 0.05 },
  }),
}

/**
 * Our Work.
 *
 * Reordered so the named properties lead and the loose photography supports
 * them. Previously this opened on twenty-one interchangeable four-by-three
 * thumbnails and put the six real properties underneath, which read as a
 * contact sheet: no hierarchy, nothing clickable near the top, and no way to
 * tell which images belonged to the same house.
 *
 * The photography is deliberately left at full saturation. The bold work is the
 * work, and grading it down to match the hero would misrepresent what the
 * studio actually builds. What changed is the framing around it — fewer things
 * competing at once, and a mosaic that lets some frames carry more weight than
 * others so the eye has somewhere to land.
 *
 * No performance figures here. The section would be much stronger with revenue
 * or occupancy attached to each property, but those are not in the repo and are
 * not something to approximate.
 */
export default function Portfolio() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="portfolio" className="bg-ivory pt-28 pb-8 px-6 lg:px-12">
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

        {/* Heading — Cormorant, matching the hero. `font-serif` is Outfit. */}
        <motion.h2
          className="font-display mb-4"
          style={{
            fontSize: 'clamp(34px, 4.4vw, 58px)',
            fontWeight: 300,
            lineHeight: 1.06,
            letterSpacing: '-0.012em',
            color: '#2C2A27',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Our Work
        </motion.h2>

        <motion.p
          className="font-sans mb-14 max-w-xl"
          style={{ fontWeight: 300, color: '#5A554E', fontSize: 17, lineHeight: 1.65 }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.18 }}
        >
          Short-term rentals we designed, furnished and styled. Each one is live on
          Airbnb — the listings below are the finished rooms, not renderings.
        </motion.p>

        {/* Featured properties — the named, linkable work leads the section. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="mb-24"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
            {properties.map((p, i) => (
              <a
                key={i}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="overflow-hidden mb-4" style={{ aspectRatio: '3/2' }}>
                  <img
                    src={p.image}
                    alt={p.name}
                    loading={i < 3 ? 'eager' : 'lazy'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="font-display transition-colors duration-200"
                      style={{
                        fontSize: 22,
                        fontWeight: 400,
                        lineHeight: 1.24,
                        color: '#2C2A27',
                        // Longest name runs to two lines. Reserving both keeps
                        // the location lines on a common baseline across the
                        // row instead of stepping wherever a title wraps.
                        minHeight: '2.48em',
                      }}
                    >
                      {p.name}
                    </p>
                    <p
                      className="font-sans mt-1.5"
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: '#B5A99A',
                      }}
                    >
                      {p.location}
                    </p>
                  </div>
                  <span
                    className="font-sans text-lg flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                    style={{ color: '#B5A99A' }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Supporting photography.
            Deliberately a uniform grid. A mosaic was tried here — every seventh
            frame taking a double square — and it tore holes in the layout: an
            item that spans two rows but carries its own aspect-ratio is not the
            height of two single rows, so the implicit rows never lined up and
            `dense` could not backfill the gaps. Uniform is also the honest
            answer now that the named properties lead the section: this block is
            texture, and it should read as subordinate rather than compete. */}
        <motion.p
          className="section-label mb-5"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Inside the properties
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 mb-16">
          {/* Trimmed to a multiple of four. The set is twenty-one, which leaves
              a single orphan tile on the last row at both two and four columns
              and reads as an unfinished grid rather than a deliberate one. */}
          {galleryImages.slice(0, 20).map((img, i) => (
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
                src={img.src || `${R2}${img.file}`}
                alt={img.alt}
                loading={i < 4 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
