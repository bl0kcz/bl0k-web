
const { $bl0k, m } = require('../lib/bl0k')

const { SimpleLayout } = require('./Layouts')

module.exports = {

  oninit () {
    $bl0k.fetchData('groups')
  },

  view () {
    const items = $bl0k.data('groups')
    if (!items) {
      return m('.p-5.text-center', 'Načítám ...')
    }
    return m(SimpleLayout, [
      m('.p-5', [
        m('h2.text-2xl.mb-10', 'Komunity'),
        m('.mb-5', items.map(item => {
          return m('.flex.w-full.items-center.mb-5', [
            m('img.w-20.rounded-full', { src: item.avatar }),
            m('.ml-5', [
              m(m.route.Link, { href: `komunita/${item.id}` }, m('.text-2xl.hover:underline', item.title)),
              m('div', item.description)
            ])
          ])
        }))
      ])
    ])
  }
}
