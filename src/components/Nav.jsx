import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const navLinks = [
  { label: 'Work', href: '#portfolio' },
  { label: 'Process', href: '#process' },
  { label: 'Services', href: '#services' },
  { label: 'FAQ', href: '#faq' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 bg-ivory transition-shadow duration-300 ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-24 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" className="flex-shrink-0" aria-label="Soraia Designs">
          <img
            src="/assets/soraia-designs-logo-transparent.png"
            alt="Soraia Designs"
            className="w-auto"
            style={{ mixBlendMode: 'multiply', height: 96 }}
          />
        </a>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="font-sans text-sm font-medium text-charcoal hover:text-brass transition-colors duration-200 tracking-wide"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <a
          href="https://calendly.com/soraia-designs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-block font-sans text-xs font-medium tracking-widest uppercase px-6 py-3 border border-brass text-charcoal hover:bg-brass hover:text-charcoal transition-all duration-300"
        >
          Book Your Strategy Call
        </a>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-charcoal"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-charcoal mb-1.5 transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-charcoal mb-1.5 transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-charcoal transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-ivory border-t border-stone px-6 pb-6">
          <ul className="flex flex-col gap-4 pt-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="font-sans text-sm font-medium text-charcoal hover:text-brass transition-colors block py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="https://calendly.com/soraia-designs"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary block text-center"
                onClick={() => setMenuOpen(false)}
              >
                Book Your Strategy Call
              </a>
            </li>
          </ul>
        </div>
      )}
    </motion.nav>
  )
}
