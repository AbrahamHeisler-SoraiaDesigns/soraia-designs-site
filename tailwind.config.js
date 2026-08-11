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
        brass:          '#7ab8c0',  // Teal (primary accent)
        sage:           '#B38F6F',  // Warm Sand (secondary accent)
        stone:          '#D4C8B8',  // light warm neutral
        'dark-bg':      '#0D0D0D',  // deep black for dark sections
        'mid-charcoal': '#2A2A2A',  // soft black for secondary text
      },
      fontFamily: {
        serif: ['Outfit', 'system-ui', 'sans-serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
        hand:  ['Caveat', 'cursive'],
        // The brand's actual display face (see ~/SDOS/skills/soraia-brand).
        // Added alongside `serif` rather than replacing it: `serif` is still
        // mapped to Outfit and used across every other section, so repointing
        // it here would restyle the whole site in one step. Sections move onto
        // `display` one at a time; when the last one does, `serif` retires.
        display: ['Cormorant Garamond', 'Georgia', 'Times New Roman', 'serif'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
    },
  },
  plugins: [],
}
