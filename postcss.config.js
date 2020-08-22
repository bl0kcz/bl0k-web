module.exports = {
  plugins: {
    'postcss-fontpath': { checkFiles: true, ie8Fix: true },
    'tailwindcss': require('tailwindcss'),
    //'@fullhuman/postcss-purgecss': process.env.NODE_ENV === 'production',
    'autoprefixer': {},
  },
}
