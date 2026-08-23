/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eventora-paper': '#F9F7F2',
        'eventora-surface': '#FFFFFF',
        'eventora-sand': '#EFEAE1',
        'eventora-ink': '#141413',
        'eventora-muted': '#52504A',
        'eventora-border': '#DCD7CE',
        'eventora-accent': '#C84B31',
        'eventora-accent-soft': '#FBE9E5',
        'eventora-accent-border': '#F3C5BC',
        'eventora-placeholder': '#8C887B',
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderColor: {
        DEFAULT: '#DCD7CE',
      }
    },
  },
  plugins: [],
}
