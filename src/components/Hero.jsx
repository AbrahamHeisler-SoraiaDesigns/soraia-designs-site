import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: 'easeOut' },
  }),
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center"
      style={{ backgroundColor: '#161616' }}
    >
      {/* Cloudflare Stream background video */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ opacity: 0.75 }}
        aria-hidden="true"
      >
        <iframe
          src="https://customer-msnzbycd3a1wmwkq.cloudflarestream.com/77079762a767664e31249c76a45cff14/iframe?autoplay=1&muted=1&loop=1&controls=0&background=1"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '56.25vw',   /* 16:9 */
            minHeight: '100%',
            minWidth: '177.77vh', /* 16:9 */
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            border: 0,
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          title="Hero background video"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-24">
        <div className="max-w-3xl" style={{ background: 'rgba(0,0,0,0.5)', padding: '2.5rem 3rem', marginLeft: '-3rem' }}>
          {/* Brass rule */}
          <motion.span
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="brass-rule mb-8 w-16 block"
          />

          {/* H1 */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="font-serif text-ivory mb-6 leading-tight"
            style={{ fontSize: 'clamp(38px, 5.5vw, 72px)', fontWeight: 700 }}
          >
            STR design that helps your property compete, convert, and hold value.
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.35}
            className="font-sans text-stone text-lg leading-relaxed mb-10 max-w-xl"
            style={{ fontWeight: 300 }}
          >
            Soraia Designs helps STR owners and investors create more compelling,
            guest-ready properties through design strategy, sourcing, and procurement.
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.5}
          >
            <a
              href="https://calendly.com/soraia-designs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-sans text-base font-semibold tracking-widest uppercase px-12 py-5 bg-white text-charcoal hover:bg-brass hover:text-charcoal transition-all duration-300"
              style={{ boxShadow: '0 0 30px rgba(255,255,255,0.25), 0 4px 15px rgba(0,0,0,0.3)' }}
            >
              Book Your Strategy Call
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
