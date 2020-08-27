const m = require('mithril')

let user = null

function loadUser (id) {
  window.bl0k.request(`/user/${id}`).then(out => {
    user = out
    m.redraw()
  })
}

module.exports = {

  oninit (vnode) {
    loadUser(vnode.attrs.user)
  },

  view () {
    if (!user) {
      return m('.m-5', 'Načítám obsah ..')
    }
    return m('.m-5', [
      m('.text-3xl', '@' + user.username)
    ])
  }
}
