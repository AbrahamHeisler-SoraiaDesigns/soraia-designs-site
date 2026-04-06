import React from 'react'

/**
 * AuroraBackground — drop-in animated aurora effect as an absolute background layer.
 * Place inside a `relative` container; existing content should be `relative z-10`.
 *
 * Props:
 *   showRadialGradient {boolean} — fade aurora toward bottom-left (default: true)
 *   opacity {number}            — overall opacity (default: 0.5)
 */
export function AuroraBackground({ showRadialGradient = true, opacity = 0.5 }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity }}
    >
      <div
        className={[
          // White-mode gradient strips
          '[--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]',
          // Aurora colour bands
          '[--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]',
          '[background-image:var(--white-gradient),var(--aurora)]',
          '[background-size:300%,_200%]',
          '[background-position:50%_50%,50%_50%]',
          // Blur + invert so it shows on light backgrounds
          'filter blur-[10px] invert',
          // Animated after-layer
          'after:content-[""] after:absolute after:inset-0',
          'after:[background-image:var(--white-gradient),var(--aurora)]',
          'after:[background-size:200%,_100%]',
          'after:animate-aurora after:[background-attachment:fixed]',
          'after:mix-blend-difference',
          'absolute -inset-[10px] will-change-transform',
          // Radial fade so aurora is subtle toward the edges
          showRadialGradient
            ? '[mask-image:radial-gradient(ellipse_at_80%_0%,black_20%,var(--transparent)_75%)]'
            : '',
        ].join(' ')}
      />
    </div>
  )
}
