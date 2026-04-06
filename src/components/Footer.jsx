function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  )
}

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com/soraia.designs', Icon: InstagramIcon },
  { label: 'Facebook',  href: 'https://facebook.com/soraiadesigns',   Icon: FacebookIcon },
  { label: 'LinkedIn',  href: 'https://linkedin.com/company/soraia-designs', Icon: LinkedInIcon },
  { label: 'TikTok',   href: 'https://tiktok.com/@soraia.designs',    Icon: TikTokIcon },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-charcoal text-stone py-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Logo + tagline */}
          <div>
            <img
              src="/assets/soraia-designs-logo-transparent.png"
              alt="Soraia Designs"
              className="h-14 w-auto mb-4"
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }}
            />
            <p className="font-sans text-stone/60 leading-relaxed" style={{ fontSize: 14 }}>
              STR interior design strategy for investors who care about returns.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="section-label mb-5 text-stone/40">Navigation</p>
            <ul className="space-y-3">
              {[
                { label: 'Our Work', href: '#portfolio' },
                { label: 'Our Process', href: '#process' },
                { label: 'Services', href: '#services' },
                { label: 'FAQ', href: '#faq' },
                { label: 'About', href: '#about' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-sans text-stone/60 hover:text-brass transition-colors duration-200"
                    style={{ fontSize: 14 }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="section-label mb-5 text-stone/40">Get in Touch</p>
            <div className="space-y-3">
              <a
                href="mailto:hello@soraiadesigns.com"
                className="font-sans text-stone/60 hover:text-brass transition-colors duration-200 block"
                style={{ fontSize: 14 }}
              >
                hello@soraiadesigns.com
              </a>
              <a
                href="https://instagram.com/soraia.designs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-stone/60 hover:text-brass transition-colors duration-200 block"
                style={{ fontSize: 14 }}
              >
                @soraia.designs
              </a>
              <div className="pt-2">
                <a
                  href="https://calendly.com/soraia-designs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-xs font-medium tracking-widest uppercase text-brass hover:text-ivory transition-colors duration-200"
                >
                  Book Your Strategy Call →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Dock */}
        <div className="border-t border-stone/10 pt-10 pb-2 flex flex-col items-center gap-6">
          <p className="section-label text-stone/30">Follow Along</p>
          <div className="flex items-center gap-3">
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group relative grid h-11 w-11 place-items-center rounded-xl ring-1 ring-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-xl shadow-lg transition-all duration-200 hover:-translate-y-1 hover:ring-brass/40 hover:bg-brass/10"
              >
                <Icon className="h-4 w-4 text-stone/60 transition-colors duration-200 group-hover:text-brass" strokeWidth={1.8} />
                {/* Tooltip */}
                <span
                  className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-wide text-stone/40 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0"
                >
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-stone/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-sans text-stone/40" style={{ fontSize: 13 }}>
            © {year} Soraia Designs. All rights reserved.
          </p>
          <p className="font-sans text-stone/30" style={{ fontSize: 12 }}>
            STR Interior Design Strategy
          </p>
        </div>
      </div>
    </footer>
  )
}
