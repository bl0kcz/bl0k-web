const m = require('mithril')
const qs = require('querystring')
const bl0k = window.bl0k

let page = null
let pageId = null
let pageLoading = false

function loadPage () {
  pageLoading = true
  const query = { id: pageId }
  bl0k.request(`/page?${qs.stringify(query)}`).then(out => {
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
        return m('.mt-2.lg:w-4/6', m('.prose', { style: 'max-width: 100% !important;' }, m.trust(page.html)))
      }
    }))
  }
}
