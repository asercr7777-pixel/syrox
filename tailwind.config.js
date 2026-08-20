/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { display: ['Cinzel', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
      colors: {
        ink: { 950: 'var(--ink-950)', 900: 'var(--ink-900)', 800: 'var(--ink-800)', 700: 'var(--ink-700)', 600: 'var(--ink-600)', 500: 'var(--ink-500)', 400: 'var(--ink-400)', 300: 'var(--ink-300)', 200: 'var(--ink-200)', 100: 'var(--ink-100)' },
        ember: { 400: 'var(--accent-400)', 500: 'var(--accent-500)', 600: 'var(--accent-600)' },
        frost: { 400: 'var(--frost-400)', 500: 'var(--frost-500)', 600: 'var(--frost-600)' },
        shadow: { 400: 'var(--shadow-400)', 500: 'var(--shadow-500)', 600: 'var(--shadow-600)' },
        gold: { 400: 'var(--gold-400)', 500: 'var(--gold-500)', 600: 'var(--gold-600)' },
        danger: { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
        emerald2: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
      },
      animation: { 'fade-in': 'fadeIn 0.4s ease-out', 'slide-up': 'slideUp 0.4s ease-out', 'pulse-glow': 'pulseGlow 2s ease-in-out infinite', 'shimmer': 'shimmer 2.5s linear infinite', 'float': 'float 6s ease-in-out infinite', 'spin-slow': 'spin 8s linear infinite', 'rank-up': 'rankUp 1.2s ease-out', 'shake': 'shake 0.4s ease-in-out' },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 20px color-mix(in srgb, var(--accent-500) 40%, transparent)' }, '50%': { boxShadow: '0 0 40px color-mix(in srgb, var(--accent-500) 70%, transparent)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        rankUp: { '0%': { opacity: '0', transform: 'scale(0.5) rotate(-10deg)' }, '50%': { opacity: '1', transform: 'scale(1.15) rotate(5deg)' }, '100%': { opacity: '1', transform: 'scale(1) rotate(0)' } },
        shake: { '0%, 100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
      },
    },
  },
  plugins: [],
};
