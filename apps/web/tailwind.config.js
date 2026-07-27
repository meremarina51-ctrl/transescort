/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-unbounded)', 'Unbounded', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        crimson: {
          DEFAULT: '#C9A86A',
          light: '#E3C48F',
          dark: '#8A6B3C',
        },
        surface: '#141414',
        elevated: '#1e1e1e',
      },
    },
  },
  plugins: [],
};
