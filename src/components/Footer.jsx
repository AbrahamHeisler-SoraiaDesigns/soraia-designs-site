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
              className="h-8 w-auto mb-4"
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

        {/* Bottom bar */}
        <div className="border-t border-stone/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
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
