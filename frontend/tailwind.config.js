/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#F7F8FA',
          surface: '#FFFFFF',
          text: '#171717',
          secondary: '#6B7280',
          border: '#E5E7EB',
          accent: '#111827',
          success: '#15803D',
          warning: '#B45309',
          danger: '#B91C1C'
        },
        // Graceful mappings for components
        dark: {
          950: '#F7F8FA',
          900: '#FFFFFF',
          850: '#F7F8FA',
          800: '#FFFFFF',
          750: '#F3F4F6',
          700: '#E5E7EB',
          600: '#D1D5DB'
        },
        forest: {
          950: '#F0FDF4',
          900: '#DCFCE7',
          800: '#BBF7D0',
          700: '#15803D',
          600: '#16A34A',
          500: '#22C55E',
          400: '#15803D',
          300: '#166534',
          200: '#14532D',
          100: '#F0FDF4'
        },
        gold: {
          700: '#92400E',
          600: '#B45309',
          500: '#D97706',
          400: '#B45309',
          300: '#92400E',
          200: '#FEF3C7'
        },
        aqua: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#083344'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'premium': '0 4px 14px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'dropdown': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'aqua-glow': '0 4px 20px -2px rgba(6, 182, 212, 0.25)',
        'aqua-sm': '0 2px 8px -1px rgba(6, 182, 212, 0.15)'
      }
    },
  },
  plugins: [],
}
