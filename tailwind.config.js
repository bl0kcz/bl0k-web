module.exports = {
  prefix: '',
  important: false,
  separator: ':',

  purge: {
    enabled: true,
    content: ['./src/**/*.html', './src/**/*.js']
  },

  theme: {
    fontFamily: {
      inter: ['Inter var experimental', 'sans-serif'],
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
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true
  },
  plugins: [
    require('@tailwindcss/custom-forms'),
    require('@tailwindcss/typography')
  ]
}
