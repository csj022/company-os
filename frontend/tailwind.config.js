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
        // Salesforce-inspired professional color palette
        salesforce: {
          blue: '#0176D3',
          'blue-dark': '#014F86',
          'blue-light': '#1A8FE3',
        },
        // Dark theme palette (similar to Mission Control)
        dark: {
          bg: '#0F1419',
          card: '#1A1F28',
          border: '#3A4352',
          hover: '#232931',
          text: {
            primary: '#F1F5F9',
            secondary: '#8B98AD',
            tertiary: '#64748B',
          }
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        'glow-salesforce': '0 0 24px rgba(1, 118, 211, 0.4)',
        'glow-success': '0 0 24px rgba(16, 185, 129, 0.4)',
        'glow-warning': '0 0 24px rgba(245, 158, 11, 0.4)',
        'glow-error': '0 0 24px rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'gradient': 'gradient-shift 3s ease infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
