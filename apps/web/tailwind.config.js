/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        ivory: '#F7F3ED',
        champagne: '#C9A962',
        bronze: '#A68B4B',
        graphite: '#6B6B6B',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'STSong', 'serif'],
        body: ['Inter', '"Source Han Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
