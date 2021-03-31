const { $bl0k, m, $ } = require('../lib/bl0k')
const Infobar = require('./Infobar')

const Header = {
  view: (vnode) => {
    let menu = []
    const chains = $bl0k.data('chains')
    if (chains) {
      menu = [
        { chainId: 'all', url: '/', chain: { name: 'Vše' } }
      ]
      for (const chainId of Object.keys(chains)) {
        const chain = chains[chainId]
        if (!chain.major) {
          continue
        }
        menu.push({ chainId: chainId, chain, url: `/${chain.name.toLowerCase()}` })
      }
      menu.push({ chainId: 'oth', chain: { name: 'Ostatní' } })

      const topics = [
        ['DeFi']
      ]
      for (const t of topics) {
        menu.push({ url: `/t/${t[0]}`, title: '#' + (t[1] || t[0]) })
      }

      // menu.push({ url: `/komunity`, title: 'Komunity' })
    }

    return m(BaseHeader, { full: true }, m('.text-sm', menu.map(mi => {
      const name = mi.title || mi.chain.name
      /* if (mi.chain.ico) {
        name = [ m(`i.pr-1.${mi.chain.ico}`, { style: 'font-family: cryptofont' } ), name ]
      } */
      const selChain = vnode.attrs.chain
      if ((selChain && (selChain === mi.chainId || selChain === name.toLowerCase())) || (mi.chainId === 'all' && !selChain)) {
        return m('span.underline.font-semibold.pr-3', name)
      }
      return m('.hidden.sm:inline-block', m(m.route.Link, { href: mi.url ? mi.url : `/chain/${mi.chainId}`, class: 'mr-3 py-3 hover:underline' }, name))
    })))
  }
}

function backLinkHandler () {
  window.history.back()
  return false
}

const BaseHeader = {
  view: (vnode) => {
    const links = []

    if (vnode.attrs.full !== true) {
      links.push(['Hlavní strana', '/', true])
    }

    if (window.history.length > 0 && vnode.attrs.showReturn) {
      links.push([[m('i.fas.fa-angle-double-left.mr-2'), 'Vrátit zpět'], backLinkHandler])
    }

    return m('.w-full.flex', [
      m('.w-5/6.lg:w-4/6.flex.items-center', [
        m('h1', m(Logo, { loadStatus: null })),
        vnode.attrs.title ? m('span.text-sm.hidden.md:inline-block', vnode.attrs.title) : '',
        m('.text-sm.flex.items-center', links.map(l => {
          const isFn = typeof (l[1]) === 'function'
          return m((isFn ? 'a' : m.route.Link), { class: 'hover:underline block mr-5 py-3' + (l[2] ? ' hidden lg:block' : ''), href: isFn ? '#' : l[1], onclick: isFn ? l[1] : null }, l[0])
        })),
        vnode.children
      ]),
      m('.w-1/6.lg:w-2/6.flex.justify-end', [
        m('.flex.items-center.text-sm.pr-5.justify-end', [
          m(m.route.Link, { href: '/create', class: 'hover:underline hidden lg:inline-block py-3' }, [m('i.fas.fa-plus.mr-2'), 'Přidat zprávu']),
          m('.ml-5', m(AuthPart))
        ])
      ])
      // m('p.text-sm', 'Rychlé zprávy z kryptoměn')
    ])
  }
}

const SimpleHeader = {
  view (vnode) {
    return [
      m(Infobar),
      m('.h-12.items-center.flex.bg-gray-100.border.border-t-0.border-l-0.border-r-0', [
        m(BaseHeader, { title: vnode.attrs.name, showReturn: true })
      ])
    ]
  }
}

const Dropdown = {
  view (vnode) {
    const auth = $bl0k.auth
    const style = {
      left: vnode.attrs.left,
      right: vnode.attrs.right,
      top: vnode.attrs.top
    }

    return m('.bl0k-dropdown.hidden.relative.text-sm', [
      m('.bg-white.absolute', { style: Object.keys(style).filter(sk => style[sk] > 0).map(sk => `${sk}: ${style[sk]}rem;`).join('') + '; z-index: 1;' }, [
        m('.w-32.h-auto.border.rounded.shadow', vnode.children)
      ])
    ])
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
    const auth = $bl0k.auth && $bl0k.auth.user

    return m('.mx-5.bl0k-dropdown-wrap.no-hidden.h-12',
      m(Dropdown, { top: '2.4', left: '0.5' }, [
        //m(m.route.Link, { href: `/autori`, class: 'hover:underline block px-3 py-1 flex-no-wrap mt-1', }, 'Autoři'),
        m(m.route.Link, { href: `/p/o-nas`, class: 'hover:underline block px-3 py-1 flex-no-wrap mt-1 mb-1', onclick: t => dropdownClick(vnode.dom) }, 'Co je to Bl0k?'),
      ]),
      m(m.route.Link, { href: '/', style: 'font-family: monospace;', class: 'block h-12 flex items-center', title: 'bl0k.cz' },
        m('.fax.fa-bl0k.transition.duration-300.ease-in-out.hover:text-red-700.hover:shadow', { style: 'font-size: 1.63rem; margin-bottom: 1px;' })
      )
      // m('img.h-8', { src: logoImage, alt: 'bl0k.cz' }))
    )
    // return m('span.mx-5.text-xl.pr-3.text-gray-700', )
  }
}


function dropdownClick (el) {
  console.log('click')
  $(el).removeClass('no-hidden')
  setTimeout(() => $(el).addClass('no-hidden'), 100)
  return true
}

const AuthPart = {
  view (vnode) {
    const auth = $bl0k.auth
    if (!auth) {
      return m('a.hover:underline', { onclick: $bl0k.actions.ethLogin, href: '#' }, 'Přihlásit')
    }
    const username = auth.username.length > 10
      ? auth.username.substring(0, 6) + '...' + auth.username.substring(38)
      : auth.username

    if (!auth.user) {
      return null
    }

    return m('.bl0k-dropdown-wrap.no-hidden.h-12', [
      m(Dropdown, { top: '2.4', right: '0.1' }, [
        m(m.route.Link, { href: `/u/${auth.user.username}`, class: 'hover:underline block px-3 py-1 flex-no-wrap mt-1', onclick: () => dropdownClick(vnode.dom) }, 'Zobrazit profil'),
        m(m.route.Link, { href: '/nastaveni', class: 'hover:underline block px-3 py-1 flex-no-wrap', onclick: () => dropdownClick(vnode.dom) }, 'Nastavení'),
        m('a', { onclick: $bl0k.actions.logout, href: '#', class: 'hover:underline block px-3 py-1 mb-1' }, 'Odhlásit')
      ]),
      m('.flex.items-center.relative.h-full', [
        m(m.route.Link, { href: `/u/${auth.user.username}` },
          m('.w-6.h-6.mr-2.rounded-full', { style: `background: url(${auth.user.avatar}); background-size: 100% 100%;` })
        ),
        m(m.route.Link, { class: 'hover:underline hidden md:inline py-3', href: `/u/${auth.user.username}` }, username)
      ])
    ])
  }
}

module.exports = {
  Header,
  BaseHeader,
  SimpleHeader,
  Logo,
  AuthPart
}
