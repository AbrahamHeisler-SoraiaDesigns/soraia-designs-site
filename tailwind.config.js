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
        brass:          '#710014',  // Crimson Depth (primary accent)
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
    },
  },
  plugins: [],
}
