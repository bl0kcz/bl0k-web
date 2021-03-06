/* globals history */

const { $bl0k, m } = require('./lib/bl0k')

const { SimpleHeader } = require('./components/Headers')
const Console = require('./components/console')
const App = require('./components/App')

m.route.prefix = ''
if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

if ('scrollRestoration' in history) {
  // Back off, browser, I got this...
  history.scrollRestoration = 'manual'
}

$bl0k.init({
  env: process.env.NODE_ENV,
  apiUrl: 'https://api.bl0k.cz/1',
  apiWsUrl: 'wss://api.bl0k.cz/wss',
  title: 'bl0k.cz - Rychlé zprávy z kryptoměn',
  titleSuffix: 'bl0k.cz',
  desc: 'Komunitní zpravodajský server zaměřený na krátké technologické zprávy ze světa kryptoměn.'
})

if (process.env.NODE_ENV !== 'production') {
  // only dev
}

window.$bl0k = $bl0k

if (window.bl0kBl0b) {
  console.log('Using inline blob ..')
  $bl0k.set('blob', window.bl0kBl0b)
}

const Layout = {
  view (vnode) {
    return [
      m(SimpleHeader, { name: '' }),
      m('div', vnode.children)
    ]
  }
}

function componentRoute (cmp, layout = true) {
  return {
    render: (vnode) => {
      let out = m(cmp, vnode.attrs)
      if (layout) {
        out = m(Layout, out)
      }
      return out
    }
  }
}

function consoleComponentRoute (cmp) {
  return {
    render: vnode => m(Console.Layout, m(Console[cmp], vnode.attrs))
  }
}

const root = document.getElementById('app')
m.route(root, '/', {
  '/': componentRoute(App, false),
  '/chain/:chain': componentRoute(App, false),
  '/t/:topic': componentRoute(App, false),
  '/0x:id': componentRoute(require('./components/Article')),
  '/0x:id/:slug': componentRoute(require('./components/Article')),
  '/p/:page': componentRoute(require('./components/Page')),
  '/u/:user': componentRoute(require('./components/UserDetail')),
  '/komunity': componentRoute(require('./components/Groups')),
  '/udalosti': componentRoute(require('./components/Events')),
  '/nastaveni': componentRoute(require('./components/Settings')),
  '/console': consoleComponentRoute('Dashboard'),
  '/create': consoleComponentRoute('Editor'),
  '/edit/:id': consoleComponentRoute('Editor'),
  '/:chain': componentRoute(App, false)
})
