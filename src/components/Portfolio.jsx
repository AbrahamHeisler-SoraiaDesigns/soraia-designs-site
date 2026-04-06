import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const R2 = 'https://pub-b732a2cfd217455192c17bafa7883c05.r2.dev/'

const galleryImages = [
  { file: '13-web-or-mls-Lets%20Go%20Click-013.jpg', alt: 'Resort pool with flamingo mural and basketball court' },
  { file: '7-web-or-mls-Lets%20Go%20Click-008.jpg', alt: 'Twilight fire pit with colorful Adirondack chairs' },
  { file: '14-web-or-mls-Lets%20Go%20Click-001.jpg', alt: 'Twilight basketball court with tropical art' },
  { file: 'DSC04457.jpg', alt: 'Blue bunk room with slide and climbing wall' },
  { file: '106-web-or-mls-Lets%20Go%20Click-081.jpeg', alt: 'Living room with neon MUSIC sign and orange sofa' },
  { file: '14-web-or-mls-Lets%20Go%20Click-014.jpg', alt: 'Tropical flamingo bedroom with teal walls' },
  { file: '138-web-or-mls-Lets%20Go%20Click-047.jpeg', alt: 'Pink palm tree wallpaper bedroom with green ceiling' },
  { file: '131-web-or-mls-Lets%20Go%20Click-054.jpeg', alt: 'Dining room with palm leaf mural and teal ceiling' },
  { file: '140-web-or-mls-Lets%20Go%20Click-045.jpeg', alt: 'Kids game room with yellow slide and arcade machines' },
  { file: '3-web-or-mls-Lets%20Go%20Click-066.jpeg', alt: 'Game room with GAME ON neon and shuffleboard' },
  { file: '50-web-or-mls-Lets%20Go%20Click-057.jpg', alt: 'Floral wallpaper bedroom with emerald velvet headboard' },
  { file: '85-web-or-mls-Lets%20Go%20Click-099.jpg', alt: 'Purple UV blacklight room with ocean murals' },
  { file: '30-web-or-mls-Lets%20Go%20Click-039.jpeg', alt: 'Navy and gold bathroom with glass shower' },
  { file: '50-web-or-mls-Lets%20Go%20Click-019.jpeg', alt: 'Home gym with dark walls and neon accents' },
  { file: '148-web-or-mls-Lets%20Go%20Click-030.jpeg', alt: 'Teal palm tree bedroom with striped curtains' },
  { file: '26-web-or-mls-Lets%20Go%20Click-036.jpeg', alt: 'Orange velvet sectional living room with gold accents' },
  { file: '139-web-or-mls-Lets%20Go%20Click-046.jpeg', alt: 'Kids playhouse bedroom with lemonade stand awning' },
  { file: '42-web-or-mls-Lets%20Go%20Click-027.jpeg', alt: 'Nautical twin bedroom with coastal styling' },
]

const properties = [
  { name: "Let's Go — Kissimmee", location: 'Kissimmee, FL', href: '#' },
  { name: 'The Flamingo House',   location: 'Orlando, FL',   href: '#' },
  { name: 'Casa Palma',           location: 'Scottsdale, AZ', href: '#' },
  { name: 'The Game Changer',     location: 'Nashville, TN',  href: '#' },
  { name: 'Neon Nights',          location: 'Las Vegas, NV',  href: '#' },
  { name: 'Coastal Retreat',      location: 'Destin, FL',     href: '#' },
]

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
          <p className="section-label mb-8">Featured Properties</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-stone/20">
            {properties.map((p, i) => (
              <a
                key={i}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-ivory px-8 py-7 flex items-start justify-between gap-4 hover:bg-white transition-colors duration-200"
              >
                <div>
                  <p
                    className="font-serif text-charcoal mb-1 group-hover:text-brass transition-colors duration-200"
                    style={{ fontSize: 20, fontWeight: 500 }}
                  >
                    {p.name}
                  </p>
                  <p className="font-sans text-stone/70" style={{ fontSize: 13, letterSpacing: '0.04em' }}>
                    {p.location}
                  </p>
                </div>
                <span
                  className="font-sans text-brass text-lg mt-0.5 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200"
                  aria-hidden="true"
                >
                  →
                </span>
              </a>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
