import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'Work', href: '#portfolio' },
  { label: 'Process', href: '#process' },
  { label: 'Services', href: '#services' },
  { label: 'FAQ', href: '#faq' },
]

/**
 * Nav.
 *
 * Two states. Over the hero it is transparent, so the photograph runs to the
 * top of the viewport; the previous solid ivory band cut the full-bleed frame
 * off at 128px and was the main thing undermining it. Past the fold it becomes
 * the solid ivory bar, because the sections below are light and ivory-on-ivory
 * would strand the links.
 *
 * The logo swaps rather than recolours. The charcoal master is composited with
 * mixBlendMode:multiply, which needs a light backdrop and disappears against a
 * dark one, so the transparent state uses the separately luminance-mapped ivory
 * file. That file keeps the counters inside the O, R, A and A dark on purpose,
 * which is what makes it read on a photograph; a blanket recolour fills them
 * and the wordmark turns to mud.
 *
 * Only the mobile sheet forces the solid treatment regardless of scroll, since
 * a transparent dropdown over a photograph is unreadable.
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const onHome = location.pathname === '/'
  const hashHref = (h) => (onHome ? h : `/${h}`)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Only the home hero sits under the nav. Every other route opens on a light
  // section, so those start solid or the links land on nothing.
  const overHero = onHome && !scrolled && !menuOpen
  const solid = !overHero

  const linkBase =
    'font-sans text-sm font-medium tracking-wide transition-colors duration-200'
  const linkTone = overHero
    ? 'text-[#F9F5EE] hover:text-white'
    : 'text-charcoal hover:text-brass'

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solid ? 'bg-ivory shadow-md' : 'bg-transparent'
      }`}
    >
      {/* Legibility scrim for the transparent state only. The hero's own scrim
          is weighted to the left, so the links on the right need their own. */}
      {overHero && (
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'linear-gradient(to bottom, rgba(24,23,21,0.55) 0%, rgba(24,23,21,0.22) 55%, rgba(24,23,21,0) 100%)',
          }}
        />
      )}

      <div
        className={`relative max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between transition-all duration-500 ${
          solid ? 'h-24' : 'h-32'
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex-shrink-0" aria-label="Soraia Designs">
          <img
            src={
              overHero
                ? '/assets/soraia-designs-logo-ivory.png'
                : '/assets/soraia-designs-logo-charcoal.png'
            }
            alt="Soraia Designs"
            className="w-auto transition-all duration-500"
            style={{
              // Both files are the same 1124x366 luminance-mapped crop, so the
              // wordmark holds its size across the swap. The old charcoal asset
              // was a 2000x2000 square that was mostly transparent padding, and
              // setting a height on it rendered the wordmark at a fraction of
              // the box, so the logo appeared to shrink on scroll.
              height: solid ? 46 : 60,
              filter: overHero ? 'drop-shadow(0 1px 14px rgba(20,19,18,0.45))' : 'none',
            }}
          />
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={hashHref(link.href)}
                className={`${linkBase} ${linkTone}`}
                style={overHero ? { textShadow: '0 1px 12px rgba(20,19,18,0.5)' } : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              to="/audit"
              className={`${linkBase} ${
                overHero ? 'text-[#D9C9A8] hover:text-[#F9F5EE]' : 'text-brass hover:text-charcoal'
              }`}
              style={overHero ? { textShadow: '0 1px 12px rgba(20,19,18,0.5)' } : undefined}
            >
              Free Audit
            </Link>
          </li>
        </ul>

        {/* Desktop CTA */}
        <a
          href="https://calendly.com/soraiadesigns/str-consult"
          target="_blank"
          rel="noopener noreferrer"
          className={`hidden md:inline-block font-sans text-xs font-medium tracking-widest uppercase px-6 py-3 border transition-all duration-300 ${
            overHero
              ? 'border-[#F9F5EE] text-[#F9F5EE] hover:bg-[#F9F5EE] hover:text-charcoal'
              : 'border-brass text-charcoal hover:bg-brass hover:text-charcoal'
          }`}
        >
          Book Your Strategy Call
        </a>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`block w-6 h-0.5 transition-all duration-200 ${i < 2 ? 'mb-1.5' : ''} ${
                menuOpen && i === 0 ? 'rotate-45 translate-y-2' : ''
              } ${menuOpen && i === 1 ? 'opacity-0' : ''} ${
                menuOpen && i === 2 ? '-rotate-45 -translate-y-2' : ''
              }`}
              style={{ backgroundColor: overHero ? '#F9F5EE' : '#161616' }}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-ivory border-t border-stone px-6 pb-6">
          <ul className="flex flex-col gap-4 pt-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={hashHref(link.href)}
                  className="font-sans text-sm font-medium text-charcoal hover:text-brass transition-colors block py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to="/audit"
                className="font-sans text-sm font-medium text-brass hover:text-charcoal transition-colors block py-1"
                onClick={() => setMenuOpen(false)}
              >
                Free Audit
              </Link>
            </li>
            <li className="pt-2">
              <a
                href="https://calendly.com/soraiadesigns/str-consult"
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
