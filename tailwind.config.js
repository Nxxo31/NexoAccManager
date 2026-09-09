/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#DE350D',      // Roblox Red - CTAs
        'primary-dark': '#B22A0A', // Hover primary
        accent: '#6347FF',       // Purple - secondary elements
        'accent-light': '#8B6FFF', // Hover accent
        'bg-dark': '#0D0D0D',    // Main background
        'bg-card': '#161616',    // Cards and panels
        'bg-surface': '#1E1E1E', // Elevated surfaces
        success: '#2ED573',      // Green - active states
        warning: '#FFA502',      // Orange - warnings
        error: '#FF4757',        // Red - errors
        border: '#2A2A2A',       // Subtle borders
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '8px',
        sm: '4px',
      },
    },
  },
  plugins: [],
}