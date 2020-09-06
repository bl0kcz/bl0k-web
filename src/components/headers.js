const m = require('mithril')
// const logoImage = require('../assets/images/logo-blok.svg')
const Infobar = require('./Infobar')

const AuthPart = {
  view () {
    const auth = window.bl0k.auth
    if (!auth) {
      return m('a.hover:underline', { onclick: window.bl0k.ethLogin, href: '#' }, 'Přihlásit')
    }
    const username = auth.username.length > 10
      ? auth.username.substring(0, 6) + '...' + auth.username.substring(38)
      : auth.username

    if (!auth.user) {
      return null
    }

    return m('.bl0k-auth-header.h-12', [
      m('.bl0k-dropdown.hidden', [
        m('.bg-white.absolute', { style: 'top: 4.7rem; right: 1rem; z-index: 1;' }, [
          m('.w-32.h-auto.border.rounded.shadow', [
            m(m.route.Link, { href: `/u/${auth.user.username}`, class: 'hover:underline block px-3 py-1 flex-no-wrap mt-1' }, 'Zobrazit profil'),
            m(m.route.Link, { href: '/settings', class: 'hover:underline block px-3 py-1 flex-no-wrap' }, 'Nastavení'),
            m('a', { onclick: window.bl0k.logout, href: '#', class: 'hover:underline block px-3 py-1 mb-1' }, 'Odhlásit')
          ])
        ])
      ]),
      m('.flex.items-center.relative.h-full', [
        m(m.route.Link, { href: `/u/${auth.user.username}` },
          m('.w-6.h-6.mr-2.rounded-full', { style: `background: url(${auth.user.avatar}); background-size: 100% 100%;` })
        ),
        m(m.route.Link, { class: 'hover:underline hidden md:inline', href: `/u/${auth.user.username}` }, username)
      ])
    ])
  }
}

const BaseHeader = {
  view: (vnode) => {
    return m('.w-full.flex', [
      m('.w-5/6.lg:w-4/6.flex.items-center', [
        m('h1', m(Logo, { loadStatus: null })),
        vnode.attrs.title ? m('span.text-sm.hidden.md:inline-block', vnode.attrs.title) : '',
        vnode.attrs.showReturn ? m('span.pl-5.text-sm', m(m.route.Link, { class: 'hover:underline', href: '/' }, '← Zpět na zprávy')) : '',
        vnode.children
      ]),
      m('.w-1/6.lg:w-2/6.flex.justify-end', [
        m('.flex.items-center.text-sm.pr-5.justify-end', [
          m(m.route.Link, { href: '/console/new', class: 'hover:underline hidden lg:inline-block' }, m.trust('Přidat novou zprávu')),
          m('.ml-5', m(AuthPart))
          // m('div', m(m.route.Link, { href: '/p/o-nas', class: 'hover:underline' }, m.trust('Co je to bl0k?')))
        ])
      ])
      // m('p.text-sm', 'Rychlé zprávy z kryptoměn')
    ])
  }
}

const SimpleHeader = {
  oninit () {
    window.bl0k.initSubpage()
  },
  view (vnode) {
    return [
      m(Infobar),
      m('.h-12.items-center.flex.bg-gray-100.border.border-t-0.border-l-0.border-r-0', [
        m(BaseHeader, { title: vnode.attrs.name, showReturn: true })
      ])
    ]
  }
}

const Logo = {
  oninit (vnode) {
    this.target = 'bl0k.cz'
    this.text = this.target
    /* this.result = '0000000'
    this.text = '0000000'
    let interval = setInterval(() => {
      const id = makeid(7)
      for (
      for (let i = 0; i < 7; i++) {
        if (id[i] === this.target[i]) {
          this.text = this.text.substring(0, i)+id[i]+this.text.substring(i+1)
          this.result = this.text.substring(0, i)+id[i]+this.text.substring(i+1)
        } else if (this.result[i] === this.target[i]) {

        } else {
          this.text = this.text.substring(0, i)+id[i]+this.text.substring(i+1)
        }
      }
      m.redraw()
      if (this.target === this.result) {
        clearInterval(interval)
      }
    }, 30) */
  },
  view (vnode) {
    return m('.mx-5',
      m(m.route.Link, { href: '/', style: 'font-family: monospace;', title: 'bl0k.cz' },
        m('i.fax.fa-bl0k', { style: 'font-size: 1.63rem; margin-top: 3px;' })
      )
      // m('img.h-8', { src: logoImage, alt: 'bl0k.cz' }))
    )
    // return m('span.mx-5.text-xl.pr-3.text-gray-700', )
  }
}

module.exports = {
  BaseHeader,
  SimpleHeader,
  Logo,
  AuthPart
}
