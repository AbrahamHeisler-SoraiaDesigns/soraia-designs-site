import flattenColorPalette from 'tailwindcss/lib/util/flattenColorPalette'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory:          '#F2F1ED',  // Soft Pearl
        charcoal:       '#161616',  // Obsidian Black
        brass:          '#E03535',  // Vivid Red (primary accent)
        sage:           '#B38F6F',  // Warm Sand (secondary accent)
        stone:          '#D4C8B8',  // light warm neutral
        'dark-bg':      '#0D0D0D',  // deep black for dark sections
        'mid-charcoal': '#2A2A2A',  // soft black for secondary text
      },
      fontFamily: {
        serif: ['Outfit', 'system-ui', 'sans-serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
      animation: {
        aurora: 'aurora 60s linear infinite',
      },
      keyframes: {
        aurora: {
          from: { backgroundPosition: '50% 50%, 50% 50%' },
          to:   { backgroundPosition: '350% 50%, 350% 50%' },
        },
      },
    },
  },
  plugins: [addVariablesForColors],
}

// Expose every Tailwind color as a CSS variable (e.g. var(--blue-500))
function addVariablesForColors({ addBase, theme }) {
  const allColors = flattenColorPalette(theme('colors'))
  const vars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  )
  addBase({ ':root': vars })
}
