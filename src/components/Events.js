
const { m } = require('../lib/bl0k')

module.exports = {

  view () {
    return m('.p-5.flex.w-full.justify-center', m('.lg:w-4/6', [
      m('h2.text-2xl', 'Události')
    ]))
  }
}
