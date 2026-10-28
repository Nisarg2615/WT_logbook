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
        primary: {
          DEFAULT: '#0B1F33',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#334E68',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#0F9D9A',
          foreground: '#FFFFFF',
        },
        background: '#F5F7FA',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0B1F33',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        critical: '#DC2626',
        info: '#2563EB',
        border: '#E2E8F0',
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B'
        }
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(11, 31, 51, 0.05), 0 1px 2px rgba(11, 31, 51, 0.05)',
      }
    },
  },
  plugins: [],
}
