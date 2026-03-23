import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1284c7',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#1284c7',
          600: '#0369a1',
          700: '#0c4a6e',
          800: '#0c3256',
          900: '#0c2336',
        },
        black: '#131418',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
        'lifted': '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'float': '0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        'nav': '0 1px 3px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.22,1,0.36,1)',
        'slide-up': 'slideUp 0.45s cubic-bezier(0.22,1,0.36,1)',
        'slide-up-1': 'slideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.05s both',
        'slide-up-2': 'slideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.1s both',
        'slide-up-3': 'slideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.15s both',
        'slide-up-4': 'slideUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.2s both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)',
        'number-pop': 'numberPop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        numberPop: {
          '0%': { transform: 'scale(0.9)', opacity: '0.6' },
          '50%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}

export default config
