/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './{pages,components}/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#C5A24A',
          sage: '#C1C6C0',
          charcoal: '#1F1F1F',
          muted: '#6B6F6A',
          success: '#2E7D32',
          warning: '#ED6C02',
          error: '#D32F2F'
        }
      },
      borderRadius: {
        athenix: '12px'
      }
    }
  },
  plugins: []
};
