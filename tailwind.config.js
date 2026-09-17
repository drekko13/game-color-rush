/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        crimson: {
          light: '#fb7185',
          DEFAULT: '#e11d48',
          dark: '#881337',
        },
        ocean: {
          light: '#38bdf8',
          DEFAULT: '#0284c7',
          dark: '#075985',
        },
        toxic: {
          light: '#34d399',
          DEFAULT: '#059669',
          dark: '#064e3b',
        },
        solar: {
          light: '#fbbf24',
          DEFAULT: '#d97706',
          dark: '#78350f',
        },
        table: {
          dark: '#0a0d14',
          surface: '#111827',
          cardBack: '#1e293b',
          felt: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'wiggle': 'wiggle 0.3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}
