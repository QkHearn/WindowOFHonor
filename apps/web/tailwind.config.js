/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        'ink-soft': '#141414',
        ivory: '#F7F3ED',
        paper: '#FFFDF9',
        parchment: '#EDE6DA',
        champagne: '#C9A962',
        bronze: '#A68B4B',
        graphite: '#3D3D3D',
        mist: '#6B6B6B',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'STSong', 'serif'],
        body: ['Inter', '"Source Han Sans SC"', '"PingFang SC"', 'sans-serif'],
      },
      boxShadow: {
        lux: '0 1px 0 rgba(201,169,98,0.12), 0 16px 48px rgba(10,10,10,0.08)',
        'lux-lg': '0 2px 0 rgba(201,169,98,0.15), 0 24px 64px rgba(10,10,10,0.12)',
        glow: '0 0 20px rgba(201, 169, 98, 0.25)',
        nav: '0 4px 24px rgba(0,0,0,0.35)',
      },
      animation: {
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        'fade-up': 'fadeUp 0.55s cubic-bezier(0.4, 0, 0.2, 1) both',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
