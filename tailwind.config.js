module.exports = {
  prefix: '',
  important: false,
  separator: ':',

  theme: {
    fontFamily: {
      inter: ['Inter', 'sans-serif'],
      mono: ['monospace']
    },
    backgroundColor: theme => ({
      ...theme('colors'),
      fb: '#3b5998',
      'fb-dark': '#2d4373',
      tw: '#55acee',
      'tw-dark': '#2795e9'
    })
  },
  variants: {},
  corePlugins: {},
  plugins: [
    require('@tailwindcss/custom-forms'),
    require('@tailwindcss/typography')
  ]
}
