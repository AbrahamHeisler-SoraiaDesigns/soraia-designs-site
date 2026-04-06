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
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.45 }}
        aria-hidden="true"
      >
        {/* TODO: For production, host video on CDN (Cloudflare R2, Bunny, Mux) instead of Google Drive */}
        <source
          src="https://drive.usercontent.google.com/download?id=1OFQKZwQnTAFk-aZdZw68Rly0J4Jdgt3w&export=download&confirm=t"
          type="video/mp4"
        />
      </video>
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-charcoal/50" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24">
        <div className="max-w-3xl">
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
              className="btn-outline text-base px-10 py-5"
            >
              Book Your Strategy Call
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
