/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'funcesi-blue':       '#1e22aa',
        'funcesi-dark':       '#15198a',
        'funcesi-green':      '#3db540',
        'funcesi-green-dark': '#2c8630',
      },
      keyframes: {
        modalUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'modal-up': 'modalUp 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
