import { Instagram, Facebook, Linkedin } from 'lucide-react'

// TikTok SVG (not in lucide-react)
function TikTokIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  )
}

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/soraia.designs',
    Icon: Instagram,
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/soraiadesigns',
    Icon: Facebook,
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/soraia-designs',
    Icon: Linkedin,
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@soraia.designs',
    Icon: TikTokIcon,
  },
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
