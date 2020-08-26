const m = require('mithril')
const blockies = require('ethereum-blockies-base64')

function makeid (length = 4) {
  var result = ''
  var characters = '.abcdefghijklmnopqrstuvwz01234567890_!@#$%^&*()+<>{}~'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

const SimpleHeader = {
  view (vnode) {
    return m('.h-12.items-center.flex.bg-gray-100.border.border-t-0.border-l-0.border-r-0', [
      m('h1', m(Logo)),
      m('span.text-sm', vnode.attrs.name),
      m('span.pl-10.text-sm', m(m.route.Link, { class: 'hover:underline', href: '/' }, '← Zpět na zprávy')),
      m('.h-12.absolute.top-0.right-0.flex.items-center.pr-5.text-sm', [
        window.bl0k.auth
          ? m('.flex.items-center', [
            m('.w-6.h-6.mr-2.rounded', { style: `background: url(${blockies(window.bl0k.auth.username)}); background-size: 100% 100%;` }),
            m('span', window.bl0k.auth.username.substring(0, 6) + '...' + window.bl0k.auth.username.substring(38)),
            m('a.ml-2.hover:underline', { onclick: window.bl0k.logout, href: '#' }, '(odhlásit)')
          ])
          : m('a.hover:underline', { onclick: window.bl0k.ethLogin, href: '#' }, 'Přihlásit s Metamask')
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
    return m('span.mx-5.text-xl.pr-3.text-gray-700', m(m.route.Link, { href: '/', style: 'font-family: monospace;' }, this.text))
  }
}

module.exports = {
  SimpleHeader,
  Logo
}
