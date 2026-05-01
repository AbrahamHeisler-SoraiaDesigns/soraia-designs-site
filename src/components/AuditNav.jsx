import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuditNav() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-ivory shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        <Link to="/" className="flex-shrink-0" aria-label="Soraia Designs — back to homepage">
          <img
            src="/assets/soraia-designs-logo-transparent.png"
            alt="Soraia Designs"
            className="w-auto"
            style={{ mixBlendMode: 'multiply', height: 80 }}
          />
        </Link>
        <Link
          to="/audit/get-started"
          className="font-sans text-xs font-medium tracking-widest uppercase px-6 py-3 border border-brass text-charcoal hover:bg-brass hover:text-charcoal transition-all duration-300"
        >
          Get My Free Audit
        </Link>
      </div>
    </motion.nav>
  )
}
