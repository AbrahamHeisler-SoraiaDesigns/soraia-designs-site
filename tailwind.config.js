/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory:          '#F9F5EE',
        charcoal:       '#2C2A27',
        brass:          '#B8975A',
        sage:           '#8A9E8C',
        stone:          '#D9C9A8',
        'dark-bg':      '#1E1C19',
        'mid-charcoal': '#3D3A35',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
    },
  },
  plugins: [],
}
