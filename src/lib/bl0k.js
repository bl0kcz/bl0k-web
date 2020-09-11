/* globals location, localStorage, WebSocket */

const m = require('mithril')
const $ = require('jquery')
const EventEmitter = require('alpeventemitter')

const utils = require('./utils')
const makeActions = require('./actions')
const pkg = require('../../package.json')

const apiEndpoints = require('../../endpoints.yaml')

class Bl0kEngine {
  constructor () {
    this.pkg = pkg
    this.version = this.pkg.version
    this.actions = makeActions({ $bl0k: this, m, $ })
    this.utils = utils
    this.store = {}
    this.requests = 0
    this._ws = null
    this.events = new EventEmitter()
    this.ws = {
      connected: null
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
    setTimeout(() => this.initWs(), 0)

    return Promise.all([
      this.initAuth()
    ])
  }

  checkCurrentVersion (version) {
    const re = /\/src\.([a-f0-9]+)\.js$/
    let current = null
    for (const t of document.getElementsByTagName('script')) {
      const match = t.src.match(re)
      if (match) {
        current = match[1]
      }
    }
    console.log('Version check:', current, version)
    if (current && current !== version) {
      location.reload()
    }
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

      if (this.auth) {
        this.wsSend('auth', this.auth.token)
      }
      this.fetchData('online').then(online => {
        if (this.options.env === 'production') {
          this.checkCurrentVersion(online.webLatest)
        }
      })
      this.fetchData('infobar')

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
      // console.log(`ws.incoming:${type}`)
      if (type === 'update') {
        for (const key of Object.keys(msg)) {
          this.dataStore.objects[key] = msg[key]
        }
        m.redraw()
      }
      if (type === 'object.update' && msg.type === 'article') {
        this.dataObjectUpdate('articles', msg.id, msg.data)
        m.redraw()
      }
      if (type === 'object.remove' && msg.type === 'article') {
        this.dataObjectDelete('articles', msg.id)
        m.redraw()
      }
      if (type === 'result') {
        if (msg.error) {
          throw new Error(msg.error)
        }
        this.events.emit(`result:${msg.rid}`, msg.data)
      }
    }
  }

  reconnectWs () {
    console.log('trying reconnect ..')
    this.initWs()
  }

  wsSend (type, msg) {
    if (!this._ws) {
      return null
    }
    return this._ws.send(JSON.stringify([type, msg]))
  }

  async wsRequest (type, msg) {
    if (!this._ws) {
      return null
    }
    const rid = this.genId()
    this.wsSend(type, { rid, ...msg })
    return new Promise(resolve => this.events.once(`result:${rid}`, resolve))
  }

  genId () {
    return Math.random().toString(36).substr(2, 9)
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
      await this.wsRequest('auth', { token: this.auth.token })
      this.fetchData('me', {}, {
        callback: (user) => {
          this.auth.user = user
        }
      })
      /* return this.request('/me').then(user => {
        this.auth.user = user
        m.redraw()
        return this.auth
      }) */
    }
    return null
  }

  data (col = 'articles') {
    return this.dataStore.objects[col]
  }

  dataObject (col = 'articles', id) {
    if (!this.dataStore.objects[col]) {
      return null
    }
    return this.dataStore.objects[col].find(x => x.id === id || x.sid === id)
  }

  dataObjectUpdate (col, id, data) {
    if (!this.dataStore.objects[col]) {
      this.dataStore.objects[col] = []
    }
    const found = this.dataStore.objects[col].findIndex(x => x.id === id || x.sid === id)
    if (found !== -1) {
      this.dataStore.objects[col][found] = data
    } else {
      this.dataStore.objects[col].push(data)
      this.dataStore.objects[col].sort((a, b) => new Date(b.date) - new Date(a.date))
    }
    return true
  }

  dataObjectDelete (col, id) {
    if (!this.dataStore.objects[col]) {
      return null
    }
    const found = this.dataStore.objects[col].findIndex(x => x.id === id)
    if (found !== -1) {
      this.dataStore.objects[col].splice(found, 1)
    }
    return true
  }

  set (key, value) {
    this.store[key] = value
  }

  request (props) {
    const par = {
      extract: xhr => ({ headers: xhr.getAllResponseHeaders(), body: JSON.parse(xhr.responseText) })
    }
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
    return m.request(par).then((res, d) => {
      if (this.requests === 0) {
        // first request - we check frontend version
      }

      this.requests += 1
      return res.body
    })
  }

  apiEndpoint (name) {
    const endpoints = Object.keys(apiEndpoints).map(u => {
      const e = apiEndpoints[u]
      const [method, url] = u.split('@')
      e.method = method
      e.url = url
      return e
    })
    return endpoints.find(x => x.handler === name)
  }

  async uniRequest (method, opts = { query: {}, params: {} }) {
    if (!opts.query) {
      opts.query = {}
    }
    if (!opts.params) {
      opts.params = {}
    }
    let res
    if (this.ws.connected) {
      res = await $bl0k.wsRequest('call', {
        method: method, args: [opts]
      })
    } else {
      const endpoint = this.apiEndpoint(method)
      if (!endpoint) {
        throw new Error(`bad endpoint: ${method}`)
      }
      const url = endpoint.url.replace(/\{([^}]+)\}/, (_, match) => {
        return opts.params[match]
      })
      const qs = new URLSearchParams()
      for (const prop of Object.keys(opts.query)) {
        if (opts.query[prop] === undefined) {
          continue
        }
        qs.append(prop, opts.query[prop])
      }
      const qsString = qs.toString()
      res = await this.request(url + (qsString ? `?${qsString}` : ''))
    }
    return res
  }

  async fetchData (type = 'bundle', opts = {}, { redraw = true, callback = null, reload = false } = {}) {
    console.log(`fetchData:${type} = ${JSON.stringify(opts)}`)
    let out = null
    if (type === 'bundle') {
      const dkey = [type, JSON.stringify(opts)].filter(x => x !== '{}').join(':')

      // reset datastore
      this.dataStore.objects.articles = null
      this.dataStore.objects.important = null
      this.dataStore.objects.header = null
      m.redraw()

      if (this.dataStore.bundles && !reload) {
        const found = this.dataStore.bundles[dkey]
        if (found) {
          out = found
          this.dataStore.objects.articles = out.articles
          this.dataStore.objects.important = out.important
          this.dataStore.objects.header = out.header
        }
      }
      if (!out) {
        m.redraw()
        // await (new Promise(resolve => setTimeout(() => resolve(), 5000)))
        const res = await $bl0k.uniRequest('bundle', { query: { chain: opts.chain, tag: opts.topic } })
        if (!res) {
          return null
        }

        this.dataStore.bundles[dkey] = res
        for (const col of Object.keys(res)) {
          this.dataStore.objects[col] = res[col]
        }
        out = res
      }
    }
    const cols = [
      ['article', 'articles']
    ]

    const col = cols.find(([c]) => c === type)
    if (col) {
      const [, dso] = col
      if (this.dataStore.objects[dso] && !reload) {
        const found = this.dataStore.objects[dso].find(a => a.sid === opts.id)
        if (found) {
          out = found

          // we need sideload comments
          if (found.commentsCount > 0 && !found.comments) {
            out = await $bl0k.uniRequest(type, { params: { id: opts.id } })
            this.dataObjectUpdate(dso, opts.id, out)
          }
        }
      }
      if (!out) {
        out = await $bl0k.uniRequest(type, { params: { id: opts.id } })
        if (out) {
          this.dataObjectUpdate(dso, opts.id, out)
        }
      }
    }

    if (['me', 'infobar', 'online', 'base', 'groups', 'events'].includes(type)) {
      if (this.dataStore.objects[type] && !reload) {
        out = this.dataStore.objects[type]
      }
      if (!out) {
        out = await $bl0k.uniRequest(type)
        if (out) {
          this.dataStore.objects[type] = out
        }
      }
    }
    if (out && callback) {
      callback(out)
    }
    if (redraw) {
      m.redraw()
    }
    return out
  }

  setPageDetail (input) {
    const title = input.title ? this.utils.shortSentences(input.title, 68) : null
    const desc = input.desc ? this.utils.shortSentences(input.desc, 165) : null

    // apply
    document.title = (title ? (title + ' - ' + this.options.titleSuffix) : this.options.title)
    document.getElementsByTagName('meta')['og:title'].content = title
    document.getElementsByTagName('meta')['og:description'].content = desc || this.options.desc
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
    this.uniRequest('symbolInfo', { params: { symbol } }).then(out => {
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
