/* globals localStorage, web3, alert, ethereum, WebSocket */

const m = require('mithril')
const $ = require('jquery')

const utils = require('./utils')
const pkg = require('../../package.json')

class Bl0kEngine {
  constructor () {
    this.pkg = pkg
    this.version = this.pkg.version
    this.utils = utils
    this.store = {}
    this._ws = null
    this.ws = {
      connected: false
    }
    this.dataStore = {
      objects: {},
      bundles: {}
    }
    this.auth = null
    this.tooltip = null
    this.tooltipLoading = false
  }

  async init (options) {
    this.options = options
    return Promise.all([
      this.initAuth(),
      this.initWs()
    ])
  }

  initWs () {
    const onClose = () => {
      this.ws = { connected: false }
      m.redraw()
      setTimeout(() => {
        this.reconnectWs()
      }, 2000)
    }
    this._ws = new WebSocket(this.options.apiWsUrl)
    this._ws.onopen = () => {
      console.log(`Websocket connected: ${this.options.apiWsUrl}`)
      this.ws = { connected: true }
      m.redraw()
    }
    this._ws.onclose = (e) => {
      console.error(`socket closed: ${e}`)
      onClose()
    }
    this._ws.onerror = (e) => {
      console.error(`socket error: ${e}`)
    }
    this._ws.onmessage = (message) => {
      let res = null
      try {
        res = JSON.parse(message.data)
      } catch (e) {
        console.error(`Invalid ws payload: ${e.message}`)
        return null
      }
      if (!Array.isArray(res)) {
        return null
      }
      const [type, msg] = res
      console.log(`ws.incoming:${type}`)
      if (type === 'update') {
        for (const key of Object.keys(msg)) {
          this.dataStore.objects[key] = msg[key]
        }
        m.redraw()
      }
    }
  }

  reconnectWs () {
    console.log('trying reconnect ..')
    this.initWs()
  }

  async initAuth () {
    const auth = localStorage.getItem('auth')
    if (auth) {
      try {
        this.auth = JSON.parse(auth)
      } catch (e) {
        console.log('Invalid auth localStorage, cleaning ..')
        localStorage.removeItem('auth')
        return false
      }
      return this.request('/me').then(user => {
        this.auth.user = user
        m.redraw()
        return this.auth
      })
    }
    return null
  }

  data (col = 'articles') {
    return this.dataStore.objects[col]
  }

  request (props) {
    const par = {}
    if (typeof (props) === 'string') {
      par.url = props
    } else {
      Object.assign(par, props)
    }
    if (!par.url.match(/^http/)) {
      par.url = this.options.apiUrl + par.url
    }
    if (this.auth) {
      par.headers = {
        authorization: `Bearer ${this.auth.token}`
      }
    }
    return m.request(par)
  }

  async fetchData (type = 'bundle', opts = {}) {
    const qs = new URLSearchParams()
    if (type === 'bundle') {
      if (opts.chain) {
        qs.append('chain', opts.chain)
      }
      if (opts.topic) {
        qs.append('tag', opts.topic)
      }
    }
    const res = await this.request(`${this.options.apiUrl}/bundle?${qs.toString()}`)

    if (type === 'bundle') {
      const dkey = [type, JSON.stringify(opts)].filter(x => x !== '{}').join(':')
      this.dataStore.bundles[dkey] = res
      for (const col of Object.keys(res)) {
        this.dataStore.objects[col] = res[col]
      }
    }
    return res
  }

  setPageDetail (input) {
    const title = input.title ? this.utils.shortSentences(input.title, 68) : null
    const desc = input.desc ? this.utils.shortSentences(input.desc, 165) : null

    // apply
    document.title = (title ? (title + ' - ' + this.options.titleSuffix) : this.options.title)
    document.getElementsByTagName('meta')['og:title'].content = title
    document.getElementsByTagName('meta')['og:description'].content = desc || this.options.desc
  }

  set (key, value) {
    this.store[key] = value
  }

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
        this.request({
          url: '/eth-login',
          method: 'POST',
          body: { addr, msg, sign: res.result }

        }).then((out) => {
          if (out.error) {
            alert(out.error)
            return false
          }

          localStorage.setItem('auth', JSON.stringify(out))
          this.initAuth()
          m.redraw()

          const rt = m.route.get()
          // console.log(rt)
          if (rt.match(/^\/chain/) || rt === '/') {
            // loadData(true)
          }
        })
      })
    })
    return false
  }

  logout () {
    localStorage.removeItem('auth')
    document.location = '/'
    return false
  }

  tooltipProcess (html) {
    return html.replace(/\$([\w\d]{3,10})/g, (m) => {
      return `<span class="bl0k-symbol border border-t-0 border-l-0 border-r-0 border-gray-500 border-dotted" onmouseenter="$bl0k.symbolTooltip(this, '${m}')" onmouseout="$bl0k.symbolTooltipHide()" style="cursor: help;">${m}</span>`
    })
  }

  symbolTooltip (e, sym) {
    const { Tooltip, TokenTooltip } = require('../components/Tooltips')
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
  }

  symbolTooltipHide () {
    this.tooltip = null
    $('#bl0k-tooltip-block').remove()
  }
}

let $bl0k
module.exports = (function () {
  if (!$bl0k) {
    $bl0k = new Bl0kEngine()
  }
  return { $bl0k, m, $ }
})()
