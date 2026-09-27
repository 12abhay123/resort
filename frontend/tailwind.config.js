/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6ef',
          100: '#e2eee0',
          400: '#5b9a91',
          500: '#0f766e',
          600: '#0c665f',
          700: '#0b5751',
          900: '#183f3a',
        },
        ink: {
          900: '#24312f',
          700: '#52605c',
        },
        ivory: '#faf8f2',
        sage: '#a7c4a0',
        sand: '#e8dcc8',
        coral: '#e88b72',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 12px 34px -24px rgba(36, 49, 47, 0.24)',
        float: '0 18px 50px -28px rgba(36, 49, 47, 0.28)',
      },
    },
  },
  plugins: [],
};
