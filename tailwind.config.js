const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ["./src/**/*.{html,js}", "./views/**/*.ejs", "./public/**/*.{css, js}"],
  theme: {
    extend: {
      colors: {
        'minimalist-gray': "#262626",
        'minimalist-text': "#D1D1D1",
      },
    },
  },
  plugins: [],
}
