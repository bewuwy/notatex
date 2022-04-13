const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ["./src/**/*.{html,js}", "./views/**/*.ejs", "./public/**/*.{css, js}", "./app.js"],
  theme: {
    extend: {
      colors: {
        'minimalist-gray': "#262626",
        'minimalist-text': "#D1D1D1",

        'primary-brown': "#2C2621",
        'primary-text': "#D4CDB3",
        'primary-text-light': '#E6CFB3',

        'button-color': 'var(--button-color)',
        'green-button-color': 'var(--green-button-color)',
        'radio-label-color': 'var(--radio-label-color)',
      },
    },
  },
  plugins: [
      require('@tailwindcss/line-clamp'),
  ],
}
