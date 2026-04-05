import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const projects = [
  {
    name: 'Project Name',
    location: 'City, State',
    description:
      'A two-bedroom STR property repositioned for the business traveler market. Design strategy focused on workspace functionality, durable finishes, and photography-first staging.',
  },
  {
    name: 'Project Name',
    location: 'City, State',
    description:
      'Lakefront cabin redesigned to appeal to group bookings. Full sourcing and procurement support, from furniture selection to final delivery coordination.',
  },
  {
    name: 'Project Name',
    location: 'City, State',
    description:
      'Urban one-bedroom condo optimized for couples and solo travelers. Emphasis on guest experience touchpoints and photography-ready design throughout.',
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

function ImagePlaceholder({ label }) {
  return (
    <div
      className="w-full flex items-center justify-center bg-stone/30"
      style={{ aspectRatio: '4/3' }}
    >
      <span className="font-sans text-xs tracking-widest uppercase text-stone select-none">
        [ {label} ]
      </span>
    </div>
  )
}

export default function Portfolio() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="portfolio" className="bg-ivory py-24 px-6 lg:px-12">
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
          className="font-serif text-charcoal mb-16"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Our Work
        </motion.h2>

        {/* Project cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {projects.map((project, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="border border-stone bg-white"
            >
              {/* Before/After */}
              <div className="grid grid-cols-2">
                <ImagePlaceholder label="Before" />
                <ImagePlaceholder label="After" />
              </div>

              {/* Info */}
              <div className="p-6">
                <p className="section-label mb-1">{project.location}</p>
                <h3
                  className="font-serif text-charcoal mb-3"
                  style={{ fontSize: 22, fontWeight: 500 }}
                >
                  {project.name}
                </h3>
                <p className="font-sans text-mid-charcoal leading-relaxed" style={{ fontSize: 14 }}>
                  {project.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <a
            href="https://calendly.com/soraia-designs"
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
