import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: 'easeOut' },
  }),
}

/**
 * Hero.
 *
 * A design firm is judged on its first photograph, so the frame is a finished
 * interior at full bleed rather than a video of a backyard. The still carries a
 * slow push-in, which reads as motion without the load cost of the stream embed
 * this replaced.
 *
 * The scrim is a gradient across the whole viewport, not a panel behind the
 * copy. The previous build put the text on a fixed-width translucent box, which
 * rendered as a visible rectangle with the photograph at full brightness either
 * side of it, and left the subhead failing contrast against the bright water.
 * Anchoring the copy over the dark left wall of the room and grading the scrim
 * to nothing on the right keeps the type legible and the room visible.
 *
 * Type is Cormorant Garamond, the brand's real display face. Note that the
 * `font-serif` class used elsewhere on the site is mapped to Outfit, a
 * geometric sans, so it is deliberately not used here.
 */
export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ backgroundColor: '#2C2A27' }}
    >
      {/* Frame */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <img
          src="/assets/coastal-luxury-surf-city.jpg"
          alt=""
          className="hero-still w-full h-full object-cover"
          fetchpriority="high"
          decoding="async"
        />
      </div>

      {/* Scrim. Left-weighted for the copy, with a floor gradient so the
          section resolves into the ivory band below it instead of cutting. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(to right, rgba(24,23,21,0.90) 0%, rgba(24,23,21,0.72) 34%, rgba(24,23,21,0.30) 62%, rgba(24,23,21,0.10) 100%),' +
            'linear-gradient(to bottom, rgba(24,23,21,0.55) 0%, rgba(24,23,21,0.10) 42%, rgba(24,23,21,0.62) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24">
        <div className="max-w-2xl">
          <motion.span
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="brass-rule mb-8 w-16 block"
          />

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="font-display mb-7"
            style={{
              fontSize: 'clamp(40px, 6vw, 82px)',
              fontWeight: 300,
              lineHeight: 1.04,
              letterSpacing: '-0.012em',
              color: '#F9F5EE',
              textShadow: '0 1px 28px rgba(20,19,18,0.5)',
            }}
          >
            STR design that helps your property compete, convert, and hold value.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.35}
            className="font-sans text-lg leading-relaxed mb-10 max-w-xl"
            style={{
              fontWeight: 300,
              color: 'rgba(249,245,238,0.92)',
              textShadow: '0 1px 18px rgba(20,19,18,0.55)',
            }}
          >
            Soraia Designs helps Airbnb and vacation rental owners create more compelling,
            guest-ready properties through interior design strategy, sourcing, and procurement.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.5}
          >
            <a
              href="https://calendly.com/soraiadesigns/str-consult"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-sans text-base font-semibold tracking-widest uppercase px-12 py-5 transition-all duration-300"
              style={{ backgroundColor: '#F9F5EE', color: '#2C2A27' }}
            >
              Book Your Strategy Call
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
