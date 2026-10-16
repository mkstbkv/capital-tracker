/** @type {import('tailwindcss').Config} */
module.exports = {
  // ВАЖНО: Добавляем эту строчку, чтобы Tailwind переключал тему по классу 'dark' в HTML
  darkMode: 'class', 
  
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
