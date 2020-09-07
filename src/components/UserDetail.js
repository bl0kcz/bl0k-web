import { format } from 'date-fns'
const { $bl0k, m } = require('../lib/bl0k')

let user = null

function loadUser (id) {
  user = null
  m.redraw()

  $bl0k.request(`/user/${id}`).then(out => {
    user = out

    const un = '@' + user.username
    $bl0k.setPageDetail({
      title: user.data.fullName ? `${user.data.fullName} (${un})` : un,
      desc: user.html.replace(/(<([^>]+)>)/gi, '')
    })
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

  onupdate (vnode) {
    if (user && (vnode.attrs.user.toLowerCase() !== user.username.toLowerCase())) {
      loadUser(vnode.attrs.user)
    }
  },

  view () {
    if (!user) {
      return m('.m-5', 'Načítám obsah ..')
    }

    const html = user.html ? $bl0k.tooltipProcess(user.html) : null

    return m('.m-5.pb-10', [
      m('.flex.w-full.justify-center', [
        m('.w-full.md:w-5/6.lg:w-4/6.md:mt-5', [
          m('.flex', [
            m('.block', m('.w-32.h-32.rounded-full', { style: `background: url(${user.avatar}); background-size: 100% 100%;` })),
            m('.block.ml-6', [
              m('.mb-2.break-all', [
                user.data.fullName ? m('.break-all', m('.text-3xl', user.data.fullName)) : '',
                m('div', { title: user.id, class: user.data.fullName ? 'text-lg' : 'text-3xl' }, '@' + user.username)
              ]),
              !user.admin ? '' : m('span.font-bold.text.px-2.py-1.w-auto.bg-red-200.text-red-700.rounded.text-sm', 'admin'),
              // m('.mt-2.wrap-all', ['ID: ', m('span.font-mono.text-xl', user.id)]),
              m('.mt-2', ['Členem od ', m('span', { title: user.created }, `${format(new Date(user.created), 'd.M.yyyy')}`)]),
              user.data.webUrl ? m('.mt-1', ['Web: ', m('a.hover:underline.text-red-700', { target: '_blank', href: user.data.webUrl, rel: 'noopener' }, user.data.webUrl)]) : '',
              user.data.twitterUsername ? m('.mt-1', ['Twitter: ', m('a.hover:underline.text-red-700', { target: '_blank', rel: 'noopener', href: `https://twitter.com/${user.data.twitterUsername}` }, '@' + user.data.twitterUsername)]) : ''
            ])
          ]),
          !html ? '' : m('.mt-5.md:mt-10.border.rounded.bg-gray-100.bl0k-base-html.', [
            m('.prose.w-full.justify-center.p-5', { style: 'max-width: 100% !important;' }, m.trust(html))
          ])
        ])
      ])
    ])
  }
}
