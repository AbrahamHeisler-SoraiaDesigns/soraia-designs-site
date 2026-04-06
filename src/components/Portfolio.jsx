import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const projects = [
  {
    name: 'The Retreat',
    location: 'Scottsdale, AZ',
    image: 'https://pub-b732a2cfd217455192c17bafa7883c05.r2.dev/128-web-or-mls-Lets%20Go%20Click-057.jpeg',
    description:
      'A two-bedroom STR repositioned for the luxury leisure market. Design strategy focused on resort-feel finishes, cohesive staging, and photography-first presentation.',
  },
  {
    name: 'The Palm House',
    location: 'Palm Springs, CA',
    image: 'https://pub-b732a2cfd217455192c17bafa7883c05.r2.dev/37-web-or-mls-Lets%20Go%20Click-032.jpeg',
    description:
      'Vacation rental redesigned around a bold tropical concept. Full sourcing and procurement support from furniture selection to final delivery coordination.',
  },
  {
    name: 'The Modern Suite',
    location: 'Nashville, TN',
    image: 'https://pub-b732a2cfd217455192c17bafa7883c05.r2.dev/48-web-or-mls-Lets%20Go%20Click-055.jpg',
    description:
      'Urban short-term rental optimized for couples and solo travelers. Emphasis on standout photography-ready design and high-impact guest experience touchpoints.',
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
              className="border border-stone bg-white overflow-hidden group"
            >
              {/* Photo */}
              <div className="overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
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
