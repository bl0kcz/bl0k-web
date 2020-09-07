const { $bl0k, m } = require('../lib/bl0k')

let page = null
let pageId = null
let pageLoading = false

function loadPage () {
  pageLoading = true
  $bl0k.request(`/page?id=${pageId}`).then(out => {
    page = out
    pageLoading = false
    m.redraw()
  })
}

module.exports = {
  oninit (vnode) {
    pageId = vnode.attrs.page
    loadPage()
  },
  view () {
    return m('.p-5.flex.w-full.justify-center', m({
      view () {
        if (!page || pageLoading) {
          return m('div', 'Načítám stránku')
        }
        return m('.mt-2.lg:w-4/6', [
          // m('.text-center', m('i.fax.fa-bl0k-new', { style: 'font-size: 20em;' })),
          m('.prose', { style: 'max-width: 100% !important;' }, m.trust(page.html))
        ])
      }
    }))
  }
}
