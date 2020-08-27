const m = require('mithril')
const dateFns = require('date-fns')

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

  onremove () {
    user = null
  },

  view () {
    if (!user) {
      return m('.m-5', 'Načítám obsah ..')
    }
    return m('.m-5', [
      m('.flex.w-full.justify-center', [
        m('.flex.w-full.lg:w-4/6.lg:mt-5', [
          m('.w-32.h-32.rounded-full', { style: `background: url(${user.avatar}); background-size: 100% 100%;` }),
          m('.block.ml-6', [
            m('.text-3xl', user.username),
            m('.mt-2', `Uživatelem od ${dateFns.format(new Date(user.created), 'd.M.yyyy')}`),
            user.twitter ? m('.mt-2', ['Twitter: ', m('a.hover:underline.text-red-700', { target: '_blank', href: `https://twitter.com/${user.twitter}` }, '@' + user.twitter)]) : ''
          ])
        ])
      ])
    ])
  }
}
