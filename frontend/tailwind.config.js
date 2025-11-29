/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        x5green: '#4CAF50',
        'x5green-dark': '#388E3C',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming Inter or system font
      },
    },
  },
  plugins: [],
}
