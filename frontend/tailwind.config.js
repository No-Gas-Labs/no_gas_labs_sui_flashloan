/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          500: '#00F5D4',
          700: '#00BFA6'
        },
        magenta: {
          500: '#FF00A8',
          700: '#D1007C'
        },
        ink: '#0B0F14'
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}