/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        fantasy: ['Cinzel', 'Georgia', 'serif'],
        'fantasy-deco': ['Cinzel Decorative', 'Georgia', 'serif'],
      },
      colors: {
        fantasy: {
          bg: '#0f0805',
          surface: '#1e120a',
          surface2: '#2d1a0e',
          border: '#4a3520',
          'border-gold': '#7a5c2e',
          gold: '#c9a227',
          'gold-light': '#e8c84e',
          text: '#f0e6d0',
          'text-muted': '#a08060',
          'text-dim': '#6a4c30',
        },
      },
      boxShadow: {
        fantasy: '0 0 20px rgba(201,162,39,0.15), inset 0 1px 0 rgba(201,162,39,0.08)',
        'fantasy-glow': '0 0 40px rgba(201,162,39,0.35)',
        tile: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 24px rgba(0,0,0,0.6)',
        'tile-active': 'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 24px rgba(0,0,0,0.6), 0 0 0 2px #c9a227',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
