import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { credits } from '../data/credits'

function CreditCard({ title, year, role, image }) {
  return (
    <div
      className="relative flex-shrink-0 w-full aspect-[2/3] overflow-hidden border border-stone bg-charcoal flex flex-col justify-end p-4"
    >
      {image ? (
        <>
          <img src={image} alt={`${title} poster`} className="absolute inset-0 w-full h-full object-cover" />
          <div
            className="absolute inset-x-0 bottom-0 h-2/3"
            style={{ background: 'linear-gradient(to top, rgba(13,13,13,0.95), rgba(13,13,13,0.55) 55%, transparent)' }}
            aria-hidden="true"
          />
        </>
      ) : (
        <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-brass rounded-full" aria-hidden="true" />
      )}
      <div className="relative z-10">
        <p
          className="font-serif text-ivory leading-tight"
          style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.02em' }}
        >
          {title}
        </p>
        <p className="font-sans text-brass mt-1" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
          {year ? `${year} · ${role}` : role}
        </p>
      </div>
    </div>
  )
}

export default function Hollywood() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="hollywood" className="bg-ivory pt-8 pb-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative lg:sticky lg:top-24"
          >
            <div className="w-full overflow-hidden aspect-[2/3] max-w-md mx-auto lg:mx-0">
              <picture>
                <source
                  type="image/webp"
                  srcSet="/assets/hollywood/soraia-hollywood-800.webp 800w, /assets/hollywood/soraia-hollywood-1200.webp 1200w, /assets/hollywood/soraia-hollywood-1600.webp 1600w"
                  sizes="(min-width: 1024px) 480px, 90vw"
                />
                <img
                  src="/assets/hollywood/soraia-hollywood-1200.jpg"
                  srcSet="/assets/hollywood/soraia-hollywood-800.jpg 800w, /assets/hollywood/soraia-hollywood-1200.jpg 1200w, /assets/hollywood/soraia-hollywood-1600.jpg 1600w"
                  sizes="(min-width: 1024px) 480px, 90vw"
                  alt="Soraia Malaquias, founder of Soraia Designs"
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
              </picture>
            </div>
            <div
              className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-brass translate-x-4 translate-y-4 max-w-md"
              style={{ marginRight: 'auto' }}
              aria-hidden="true"
            />
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="section-label mb-6">Meet the Designer</span>

            <h2
              className="font-serif text-charcoal mt-6 mb-6"
              style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 400 }}
            >
              Before short-term rentals, Soraia built worlds for Hollywood.
            </h2>

            <div className="space-y-5 font-sans text-charcoal leading-relaxed" style={{ fontSize: 16 }}>
              <p>
                Soraia trained at a design school in Lisbon, then spent a decade in visual
                effects. Her credits run from Aquaman and Ford v Ferrari to Disney's Pinocchio
                and Snow White. She also worked with Epic Games on Fortnite.
              </p>
              <p>
                Film taught her one thing: people remember how a world made them feel. Every
                frame has a single job: hold your attention. Lose it and the audience is gone.
              </p>
              <p>
                A rental listing works the same way. Guests scroll past hundreds of properties
                that all look alike. The one that stops the scroll, then delivers a stay worth
                talking about, wins the repeat bookings and the nightly rate that comes with it.
              </p>
              <p>That's the work now: spaces guests remember, revenue owners can see.</p>
            </div>

            <div className="mt-8 pl-6 border-l-2 border-brass">
              <p
                className="font-serif text-charcoal"
                style={{ fontSize: 20, fontWeight: 600 }}
              >
                A trained human designs your property. Every single time.
              </p>
            </div>

            {/* Credit strip */}
            <div className="mt-12 grid grid-cols-3 sm:grid-cols-5 gap-3">
              {credits.map((c) => (
                <CreditCard key={c.title} {...c} />
              ))}
            </div>

            <a
              href="https://www.imdb.com/name/nm10303210/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-5 font-sans text-brass hover:text-charcoal transition-colors"
              style={{ fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 4 }}
            >
              Full credits on IMDb →
            </a>

            <div className="mt-10">
              <a
                href="https://calendly.com/soraiadesigns/str-consult"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Book a Strategy Call
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
