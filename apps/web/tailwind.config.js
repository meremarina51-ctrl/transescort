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
          DEFAULT: '#c81e4a',
          light: '#ff4d78',
          dark: '#6e0f2a',
        },
        surface: '#141414',
        elevated: '#1e1e1e',
      },
    },
  },
  plugins: [],
};
