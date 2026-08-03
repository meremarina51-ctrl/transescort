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
        accent: {
          DEFAULT: '#6C5CE7',
          light: '#A29BFE',
          dark: '#4834B0',
        },
        surface: '#141414',
        elevated: '#1e1e1e',
      },
    },
  },
  plugins: [],
};
