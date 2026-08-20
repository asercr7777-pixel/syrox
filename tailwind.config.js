/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { display: ['Cinzel', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
      colors: {
        ink: { 950: 'rgb(var(--ink-950) / <alpha-value>)', 900: 'rgb(var(--ink-900) / <alpha-value>)', 800: 'rgb(var(--ink-800) / <alpha-value>)', 700: 'rgb(var(--ink-700) / <alpha-value>)', 600: 'rgb(var(--ink-600) / <alpha-value>)', 500: 'rgb(var(--ink-500) / <alpha-value>)', 400: 'rgb(var(--ink-400) / <alpha-value>)', 300: 'rgb(var(--ink-300) / <alpha-value>)', 200: 'rgb(var(--ink-200) / <alpha-value>)', 100: 'rgb(var(--ink-100) / <alpha-value>)' },
        ember: { 400: 'rgb(var(--accent-400) / <alpha-value>)', 500: 'rgb(var(--accent-500) / <alpha-value>)', 600: 'rgb(var(--accent-600) / <alpha-value>)' },
        frost: { 400: 'rgb(var(--frost-400) / <alpha-value>)', 500: 'rgb(var(--frost-500) / <alpha-value>)', 600: 'rgb(var(--frost-600) / <alpha-value>)' },
        shadow: { 400: 'rgb(var(--shadow-400) / <alpha-value>)', 500: 'rgb(var(--shadow-500) / <alpha-value>)', 600: 'rgb(var(--shadow-600) / <alpha-value>)' },
        gold: { 400: 'rgb(var(--gold-400) / <alpha-value>)', 500: 'rgb(var(--gold-500) / <alpha-value>)', 600: 'rgb(var(--gold-600) / <alpha-value>)' },
        danger: { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
        emerald2: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
      },
      animation: { 'fade-in': 'fadeIn 0.4s ease-out', 'slide-up': 'slideUp 0.4s ease-out', 'pulse-glow': 'pulseGlow 2s ease-in-out infinite', 'shimmer': 'shimmer 2.5s linear infinite', 'float': 'float 6s ease-in-out infinite', 'spin-slow': 'spin 8s linear infinite', 'rank-up': 'rankUp 1.2s ease-out', 'shake': 'shake 0.4s ease-in-out' },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 20px rgb(var(--accent-500) / 40%)' }, '50%': { boxShadow: '0 0 40px rgb(var(--accent-500) / 70%)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        rankUp: { '0%': { opacity: '0', transform: 'scale(0.5) rotate(-10deg)' }, '50%': { opacity: '1', transform: 'scale(1.15) rotate(5deg)' }, '100%': { opacity: '1', transform: 'scale(1) rotate(0)' } },
        shake: { '0%, 100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
      },
    },
  },
  plugins: [],
};
