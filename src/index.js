const { $bl0k, m } = require('./lib/bl0k')

const { SimpleHeader } = require('./components/Headers')
const Console = require('./components/console')
const App = require('./components/App')

m.route.prefix = ''

$bl0k.init({
  apiUrl: 'https://api.bl0k.cz/1',
  apiWsUrl: 'wss://api.bl0k.cz/wss',
  title: 'bl0k.cz - Rychlé zprávy z kryptoměn',
  titleSuffix: 'bl0k.cz',
  desc: 'Komunitní zpravodajský server zaměřený na krátké technologické zprávy ze světa kryptoměn.'
})

if (process.env.NODE_ENV !== 'production') {
  // only dev
  window.$bl0k = $bl0k
}

/*
const bl0k = window.bl0k = {
  auth: null,
  tooltip: null,
  tooltipLoading: false,
  options,
  wsConnected: false,
  bundleData: () => data,
  ethLogin () {
    if (!window.ethereum) {
      alert('Nemáte nainstalovanou MetaMask!')
      return false
    }
    ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
      const addr = accounts[0]
      const msg = `Přihlášení na bl0k.cz [${Number(new Date())}]`
      const cmd = { method: 'personal_sign', params: [msg, addr], from: addr }
      web3.currentProvider.sendAsync(cmd, (err, res) => {
        if (err) {
          console.log('Chyba při podpisu')
          console.error(err)
          return false
        }

        bl0k.request({
          url: `${options.apiUrl}/eth-login`,
          method: 'POST',
          body: { addr, msg, sign: res.result }
        }).then((out) => {
          if (out.error) {
            alert(out.error)
            return false
          }

          localStorage.setItem('auth', JSON.stringify(out))
          window.bl0k.initAuth()
          m.redraw()

          const rt = m.route.get()
          // console.log(rt)
          if (rt.match(/^\/chain/) || rt === '/') {
            loadData(true)
          }
        })
      })
    })
    return false
  },
  deleteArticle (item) {
    if (!confirm(`Opravdu smazat zprávu "${item.sid}"?`)) {
      return false
    }
    window.bl0k.request({
      method: 'DELETE',
      url: `/article/${item.id}`
    }).then(() => {
      loadData(true)
    })
    return false
  },
  changeArticleType (item, type) {
    if (!confirm(`Opravdu změnit stav zprávy "${item.id}" na "${type}"?`)) {
      return false
    }
    window.bl0k.request({
      method: 'POST',
      url: `/article/${item.id}/type`,
      body: {
        type
      }
    }).then(() => {
      loadData(true)
    })
  },
  request (props) {
    const par = {}
    if (typeof (props) === 'string') {
      par.url = props
    } else {
      Object.assign(par, props)
    }
    if (!par.url.match(/^http/)) {
      par.url = options.apiUrl + par.url
    }
    if (window.bl0k.auth) {
      par.headers = {
        authorization: `Bearer ${window.bl0k.auth.token}`
      }
    }
    return m.request(par)
  },
  setPageDetail (input) {
    const title = input.title ? shortSentences(input.title, 68) : null
    const desc = input.desc ? shortSentences(input.desc, 165) : null

    // apply
    document.title = (title ? (title + ' - ' + options.titleSuffix) : options.title)
    document.getElementsByTagName('meta')['og:title'].content = title
    document.getElementsByTagName('meta')['og:description'].content = desc || options.desc
  },
  symbolTooltip (e, sym) {
    if (this.tooltip) {
      this.tooltip = null
    }
    this.tooltipLoading = true
    const base = $(e).closest('.bl0k-base-html')
    base.prepend('<div id="bl0k-tooltip-block" class="absolute left-0 top-0"></div>')

    $(e).css('cursor', 'wait')
    const te = $('#bl0k-tooltip-block').get(0)

    const symbol = sym.match(/^\$(.+)$/)[1]
    const rect = e.getBoundingClientRect()
    const rectBase = base.get(0).getBoundingClientRect()
    // console.log(rect, rectBase, e.offsetTop, e.offsetLeft)
    const w = 400
    this.request(`/symbol/${symbol}`).then(out => {
      this.tooltipLoading = false
      this.tooltip = {
        content: m(TokenTooltip, { data: out }),
        top: e.offsetTop + rect.height + 5,
        left: (rect.left + w) > rectBase.right ? (e.offsetLeft - ((rect.left + w) - rectBase.right)) : e.offsetLeft - 5
      }
      $(e).css('cursor', 'help')
      m.render(te, m(Tooltip, { data: this.tooltip }))
      // m.redraw()
    })
    return false
  },
  symbolTooltipHide () {
    this.tooltip = null
    $('#bl0k-tooltip-block').remove()
  },
  tooltipProcess (html) {
    return html.replace(/\$([\w\d]{3,10})/g, (m) => {
      return `<span class="bl0k-symbol border border-t-0 border-l-0 border-r-0 border-gray-500 border-dotted" onmouseenter="bl0k.symbolTooltip(this, '${m}')" onmouseout="bl0k.symbolTooltipHide()" style="cursor: help;">${m}</span>`
    })
  },
  reconnectWs () {
    console.log('trying reconnect ..')
    this.initWs()
  },
  initSubpage () {
    loadData()
  },
  initWs () {
    const onClose = () => {
      this.wsConnected = false
      m.redraw()
      setTimeout(() => {
        this.reconnectWs()
      }, 2000)
    }
    this.ws = new WebSocket(options.apiWsUrl)
    this.ws.onopen = () => {
      console.log(`Websocket connected: ${options.apiWsUrl}`)
      this.wsConnected = true
      m.redraw()
    }
    this.ws.onclose = (e) => {
      console.error(`socket closed: ${e}`)
      onClose()
    }
    this.ws.onerror = (e) => {
      console.error(`socket error: ${e}`)
    }
    this.ws.onmessage = function incoming (message) {
      let res = null
      try {
        res = JSON.parse(message.data)
      } catch (e) {
        console.error(`Invalid wss payload: ${e.message}`)
        return null
      }
      if (!Array.isArray(res)) {
        return null
      }
      const [type, msg] = res
      console.log(`wss.incoming:${type}`)
      if (type === 'update') {
        for (const key of Object.keys(msg)) {
          data[key] = msg[key]
        }
        m.redraw()
      }
    }
  },
  init () {
    //this.initAuth()
    this.initWs()
  },
  formatAmount (amount, precision = 2, preset = 'usd') {
    const presets = {
      usd: { separator: ' ', decimal: ',', pattern: '# !', symbol: ' $' },
      czk: { separator: ' ', decimal: ',', pattern: '# !', symbol: ' Kč' }
    }
    return currency(amount, Object.assign({}, presets[preset], { precision })).format()
  }
}

bl0k.init()

function loadData (refresh = false) {
  $bl0k.fetchData('bundle', opts).then(out => {
    $bl0k.setPageDetail({
      title: (out.header && out.header.data && (opts.chain || opts.topic)) ? out.header.data.title : null
    })
  })
}

let selected = null
function selectItem (id) {
  return (e) => {
    const classes = e.target.className.split(' ')
    if (e.target.nodeName === 'A' ||
      classes.includes('bl0k-symbol') ||
      classes.includes('bl0k-no-click')
    ) {
      return true
    }
    selected = (selected === id) ? null : id
    console.log('Selected: ' + selected)
    return false
  }
} */

function consoleComponentRoute (cmp) {
  return {
    render: (vnode) => {
      return m(Console.Layout, m(Console[cmp], vnode.attrs))
    }
  }
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

const root = document.getElementById('app')
m.route(root, '/', {
  '/': componentRoute(App, false),
  '/chain/:chain': componentRoute(App, false),
  '/t/:topic': componentRoute(App, false),
  '/0x:id': componentRoute(require('./components/Article')),
  '/0x:id/:slug': componentRoute(require('./components/Article')),
  '/p/:page': componentRoute(require('./components/Page')),
  '/u/:user': componentRoute(require('./components/UserDetail')),
  '/settings': componentRoute(require('./components/Settings')),
  '/console': consoleComponentRoute('Dashboard'),
  '/console/new': consoleComponentRoute('Editor'),
  '/console/edit/:id': consoleComponentRoute('Editor'),
  '/:chain': componentRoute(App, false)
})
