/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DevSkill Theme Mapping:
        // Vibrant Coral/Orange as Primary, Emerald Green as Secondary, Warm Cream as Background
        brand: {
          orange: '#FF5E3A',
          'orange-hover': '#E84E2A',
          'orange-light': '#FFF0EB',
          'orange-border': '#FEEAE1',
          green: '#00B074',
          'green-hover': '#059669',
          'green-light': '#E8F8F2',
          bg: '#FFF6F2',
          surface: '#FFFFFF',
          dark: '#111827',
          gray: '#4B5563',
          border: '#FEEAE1'
        },
        theme: {
          bg: '#FFF6F2',
          surface: '#FFFFFF',
          text: '#111827',
          secondary: '#4B5563',
          border: '#FEEAE1',
          accent: '#FF5E3A',
          success: '#00B074',
          warning: '#F59E0B',
          danger: '#EF4444'
        },
        // Global override for cyan so all existing components seamlessly adopt the warm Coral/Orange theme
        cyan: {
          50: '#FFF6F2',
          100: '#FEEAE1',
          200: '#FED7C7',
          300: '#FDAE94',
          400: '#FF805B',
          500: '#FF5E3A',
          600: '#E84E2A',
          700: '#C73817',
          800: '#9E2C11',
          900: '#7F240E',
          950: '#4A1104'
        },
        // Global override for teal so gradients seamlessly transition into vibrant Emerald Green
        teal: {
          50: '#E8F8F2',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#00B074',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22'
        },
        // Graceful mappings for aqua and dark
        aqua: {
          50: '#FFF6F2',
          100: '#FEEAE1',
          200: '#FED7C7',
          300: '#FDAE94',
          400: '#FF805B',
          500: '#FF5E3A',
          600: '#E84E2A',
          700: '#C73817',
          800: '#9E2C11',
          900: '#7F240E',
          950: '#4A1104'
        },
        dark: {
          950: '#FFF6F2',
          900: '#FFFFFF',
          850: '#FFF9F6',
          800: '#FFFFFF',
          750: '#FFF0EB',
          700: '#FEEAE1',
          600: '#E5E7EB'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(255, 94, 58, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'premium': '0 4px 18px 0 rgba(255, 94, 58, 0.08)',
        'card': '0 1px 4px 0 rgba(255, 94, 58, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'dropdown': '0 12px 28px -5px rgba(255, 94, 58, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'orange-glow': '0 4px 20px -2px rgba(255, 94, 58, 0.35)',
        'orange-sm': '0 2px 8px -1px rgba(255, 94, 58, 0.2)',
        'green-glow': '0 4px 20px -2px rgba(0, 176, 116, 0.35)',
        'green-sm': '0 2px 8px -1px rgba(0, 176, 116, 0.2)'
      }
    },
  },
  plugins: [],
}
