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
        navy: {
          900: '#101828',
          800: '#172033',
          700: '#1E293B',
        },
        brand: {
          blue: '#2563EB',
          teal: '#0D9488',
          cyan: '#06B6D4',
          purple: '#8B5CF6'
        },
        status: {
          success: '#16A34A',
          warning: '#D97706',
          critical: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
