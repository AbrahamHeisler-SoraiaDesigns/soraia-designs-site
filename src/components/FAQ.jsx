import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { AuroraBackground } from './ui/AuroraBackground'

const faqs = [
  {
    q: 'How is this different from hiring a regular interior designer?',
    a: "Most interior designers focus on aesthetics — color palettes, furniture styles, what looks good. We focus on what works in the STR market. That means every decision is informed by market data, guest behavior, and investment performance. We're not here to make your property look like a magazine. We're here to make it compete.",
  },
  {
    q: 'Do I need a full design package, or can I just book a strategy call?',
    a: "You can absolutely start with a strategy consultation. Many clients come in needing clarity before they commit to a full project. The consultation is designed to give you that — a clear picture of your options, priorities, and what a realistic investment looks like.",
  },
  {
    q: 'What markets do you work in?',
    a: "We work with STR owners and investors across a range of markets. Our process is built around analyzing your specific market, not applying a one-size-fits-all approach. Book a call and we'll talk through whether our services are a fit for your situation.",
  },
  {
    q: 'How long does a full design project take?',
    a: "Timeline depends on project scope, property size, and procurement complexity. We establish a clear timeline during the strategy phase so you know what to expect before we begin. Most design packages run 4–10 weeks from kickoff to delivery-ready.",
  },
  {
    q: 'Do you handle purchasing and deliveries?',
    a: "Yes — procurement coordination is available as an add-on service. We manage vendor relationships, track orders, and handle the logistics so you don't have to coordinate 20 deliveries yourself. Ask about this during your strategy call.",
  },
  {
    q: 'What does the strategy consultation include?',
    a: "A focused session covering your property, your target guest, your market positioning, and your investment goals. You'll leave with a clear understanding of what your property needs, what it doesn't, and what your next step should be — whether that's working with us or not.",
  },
]

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className={`border-b border-stone ${isOpen ? 'border-l-2 border-l-brass' : ''}`}>
      <button
        className="w-full flex items-center justify-between py-6 px-6 text-left group"
        onClick={onToggle}
      >
        <span
          className={`font-sans font-medium pr-8 transition-colors duration-200 ${
            isOpen ? 'text-brass' : 'text-charcoal group-hover:text-brass'
          }`}
          style={{ fontSize: 16 }}
        >
          {item.q}
        </span>
        <span
          className={`flex-shrink-0 w-6 h-6 border border-current flex items-center justify-center transition-all duration-200 ${
            isOpen ? 'text-brass rotate-45' : 'text-stone group-hover:text-brass'
          }`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line x1="5" y1="0" x2="5" y2="10" stroke="currentColor" strokeWidth="1.5" />
            <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p
              className="font-sans text-mid-charcoal leading-relaxed px-6 pb-6"
              style={{ fontSize: 15 }}
            >
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section id="faq" className="relative bg-ivory py-24 px-6 lg:px-12">
      <AuroraBackground showRadialGradient opacity={0.75} />
      <div className="relative z-10 max-w-3xl mx-auto" ref={ref}>
        {/* Heading */}
        <motion.h2
          className="font-serif text-charcoal mb-16"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Common Questions
        </motion.h2>

        {/* Accordion */}
        <motion.div
          className="border-t border-stone"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {faqs.map((item, i) => (
            <FAQItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
