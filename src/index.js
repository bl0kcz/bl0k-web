/* globals localStorage, web3, alert, ethereum, confirm */
const m = require('mithril')
const qs = require('querystring')
const $ = require('jquery')
const currency = require('currency.js')

const Console = require('./components/console')
const { SimpleHeader, Logo, AuthPart } = require('./components/headers')
const ArticleContent = require('./components/ArticleContent')

const options = {
  apiUrl: 'https://api.bl0k.cz/1',
  title: 'bl0k.cz - Rychlé zprávy z kryptoměn',
  titleSuffix: 'bl0k.cz',
  desc: 'Komunitní zpravodajský server zaměřený na krátké technologické zprávy ze světa kryptoměn.'
}

m.route.prefix = ''

let opts = {}
let dataLoading = false
let data = {
  articles: [],
  article: null,
  header: null,
  important: [],
  chains: {},
  menu: []
}

const loadStatus = {
  items: [],
  start: function (j) { this.items.push(j) },
  end: function (j) { this.items.pop(j) },
  active: function () { return this.items.length > 0 }
}

const Tooltip = {
  view (vnode) {
    const tt = vnode.attrs.data
    const style = `z-index: 1; top: ${tt.top || 0}px; left: ${tt.left || 0}px; width: 320px;`
    return m('#bl0k-tooltip.absolute.border.py-1.px-2.bg-white.shadow.shadow-lg.rounded.transition-all.duration-300.ease-in-out', {
      style,
      onclick: () => {
        window.bl0k.symbolTooltipHide()
      }
    }, tt.content)
  }
}

const TokenTooltip = {
  view (vnode) {
    const d = vnode.attrs.data
    if (!d) {
      return m('div', 'Token nenalezen')
    }
    return m('.w-auto', [
      m('.flex', [
        m('div.mt-1.h-full', [
          m('.block', [
            m('img.h-10', { src: d.image.large })
          ])
        ]),
        m('div', [
          m('.flex.items-center', [
            m('.ml-2.text-lg.font-bold', d.name),
            m('.ml-2', '(' + d.symbol.toUpperCase() + ')')
          ]),
          m('div', [
            m('.ml-2', [
              m('span.font-bold', bl0k.formatAmount(d.market_data.current_price.usd)),
              m('span.ml-2.text-sm.text-gray-700', '(' + bl0k.formatAmount(d.market_data.current_price.czk, 2, 'czk') + ')'),
              m('span.ml-2', { class: `text-md text-${d.market_data.price_change_24h > 0 ? 'green' : 'red'}-700` }, (d.market_data.price_change_24h > 0 ? '+' : '') + (Math.round(((d.market_data.price_change_24h) * 100)) / 100) + '%')
            ])
          ])
        ])
      ]),
      // m('.mt-2.text-sm', d.description.en)
      m('.mx-1.my-2.text-sm', [
        // m('div', `Zásoba v oběhu: ${d.market_data.circulating_supply}`),
        m('div', `Tržní kapitalizace: ${bl0k.formatAmount(d.market_data.market_cap.usd, 0)}`),
        d.market_data.fully_diluted_valuation.usd ? m('div', `FDV: ${bl0k.formatAmount(d.market_data.fully_diluted_valuation.usd)}`) : ''
      ])
    ])
  }
}

const bl0k = window.bl0k = {
  auth: null,
  tooltip: null,
  tooltipLoading: false,
  ethLogin () {
    if (!window.ethereum) {
      alert('Nemáte nainstalovanou MetaMask!')
      return false
    }
    ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
      const addr = accounts[0]
      /* web3.eth.sign(window.bl0k.ethAccount, 'xxx', (err, res) => {
        console.log(err, res)
      }) */
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
          console.log(rt)
          if (rt.match(/^\/chain/) || rt === '/') {
            loadData(true)
          }
        })
      })
    })
    return false
  },
  logout () {
    localStorage.removeItem('auth')
    document.location = '/'
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
    const w = 320
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
  initAuth () {
    const auth = localStorage.getItem('auth')
    if (auth) {
      window.bl0k.auth = JSON.parse(auth)
      this.request('/me').then(user => {
        this.auth.user = user
        m.redraw()
      })
    }
  },
  init () {
    this.initAuth()
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

function shortSentences (str, max = 100) {
  if (str.length < max) {
    return str
  }
  const out = []
  let count = 0
  for (const s of str.split(' ')) {
    count += s.length + 1
    if (count > max) {
      break
    }
    out.push(s)
  }
  return out.join(' ') + '..'
}

function loadData (refresh = false) {
  dataLoading = true
  loadStatus.start('bundle')
  if (refresh) {
    data.articles = []
    data.important = []
    data.header = null
    m.redraw()
  }
  const query = {}
  if (opts.chain) {
    query.chain = opts.chain
  }
  if (opts.topic) {
    query.tag = opts.topic
  }
  window.bl0k.request(`${options.apiUrl}/bundle?${qs.stringify(query)}`).then(out => {
    dataLoading = false
    if (!out) {
      return null
    }
    data = out

    window.bl0k.setPageDetail({
      title: (out.header && out.header.data && (opts.chain || opts.topic)) ? out.header.data.title : null
    })

    m.redraw()

    setTimeout(() => {
      loadStatus.end('bundle')
    })

    data.menu = [
      { chainId: 'all', url: '/', chain: { name: 'Vše' } }
    ]
    for (const chainId of Object.keys(data.chains)) {
      const chain = data.chains[chainId]
      if (!chain.major) {
        continue
      }
      data.menu.push({ chainId: chainId, chain, url: `/${chain.name.toLowerCase()}` })
    }
    data.menu.push({ chainId: 'oth', chain: { name: 'Ostatní' } })

    const topics = [
      ['DeFi']
    ]
    for (const t of topics) {
      data.menu.push({ url: `/t/${t[0]}`, title: '#' + (t[1] || t[0]) })
    }
  })
}

const Header = {
  view: (vnode) => {
    return [
      m('h1', m(Logo, { loadStatus })),
      m('.text-sm', data.menu.map(mi => {
        const name = mi.title || mi.chain.name
        /* if (mi.chain.ico) {
          name = [ m(`i.pr-1.${mi.chain.ico}`, { style: 'font-family: cryptofont' } ), name ]
        } */
        const selChain = vnode.attrs.chain
        if ((selChain && (selChain === mi.chainId || selChain === name.toLowerCase())) || (mi.chainId === 'all' && !selChain)) {
          return m('span.underline.font-semibold.pr-3', name)
        }
        return m('.hidden.sm:inline-block', m(m.route.Link, { href: mi.url ? mi.url : `/chain/${mi.chainId}`, class: 'mr-3 py-4 hover:underline' }, name))
      })),
      m('.absolute.top-0.right-0.h-12.flex.items-center.text-sm.pr-5', [
        m(m.route.Link, { href: '/console/new', class: 'hover:underline hidden lg:inline-block' }, m.trust('Přidat novou zprávu')),
        m('.ml-5', m(AuthPart))
        // m('div', m(m.route.Link, { href: '/p/o-nas', class: 'hover:underline' }, m.trust('Co je to bl0k?')))
      ])
      // m('p.text-sm', 'Rychlé zprávy z kryptoměn')
    ]
  }
}

let selected = null
function selectItem (id) {
  return (e) => {
    const classes = e.target.className.split(' ')
    if (e.target.nodeName === 'A' ||
      classes.includes('bl0k-symbol') ||
      classes.includes('bl0k-no-click')
    ) {
      /* if ($('#bl0k-tooltip').get(0)) {
        window.bl0k.symbolTooltipHide()
      } */
      return true
    }
    selected = (selected === id) ? null : id
    console.log('Selected: ' + selected)
    return false
  }
}

const InfoPanel = {
  view () {
    return m('.p-5', [
      m('.bg-teal-100.border-t-4.border-teal-500.rounded-b.text-teal-900.px-4.py-3', { role: 'alert' }, [
        m('.flex', [
          m('.py-1', m('svg.fill-current.h-6.w-6.text-teal-500.mr-4', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20' }, m('path', { d: 'M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z' }))),
          m('div', [
            m('p.text-2xl', 'Zkušební režim'),
            // m('p.font-bold', 'Vítejte na bl0k.cz!'),
            m('p.text-sm', [
              // 'Toto je zkušební provoz. ',
              'Již brzy vám začneme přinášet aktuální zprávy z kryptoměn. ',
              m(m.route.Link, { class: 'underline', href: '/p/o-nas' }, 'Co je to Bl0k.cz?')
            ])
          ])
        ])
      ])
    ])
  }
}

const Feed = {
  view: (vnode) => {
    if (dataLoading) {
      return m('.p-5', 'Načítám obsah ...')
    }
    const items = vnode.attrs.items
    const important = vnode.attrs.important
    const maxi = vnode.attrs.maxi
    if (items.length === 0) {
      return m('.p-5', 'Nenalezeny žádné zprávy.')
    }
    return m('div', [
      (opts.chain || opts.topic || important || window.bl0k.auth) ? '' : m(InfoPanel),
      m('div', items.map(i => {
        const bg = ((type) => {
          switch (type) {
            case 'draft':
              return 'bg-orange-200'
            case 'in-queue':
              return 'bg-green-200'
          }
          return ''
        })(i.type)
        return m(`article.${important ? '' : 'lg:flex.'}.p-5.border.border-t-0.border-l-0.border-r-0.border-dashed.${bg || ''}`,
          { key: i.id, onclick: selectItem(`${maxi ? 'ax' : 'a'}:${i.id}`) }, m(ArticleContent, { item: i, maxi, important, selected }))
      }))
    ])
  }
}

const FeedHeader = {
  view (vnode) {
    const h = vnode.attrs.data.header
    if (!h || !h.data) {
      return null
    }
    return m('.bg-gray-200', [
      m('.px-5.py-3.border.border-t-0.border-l-0.border-r-0', [
        m('h2.text.font-semibold.text-md', h.data.title),
        h.type === 'topic' ? [
          /* h.data.tags ? m('.mt-2', [
            m('.text-sm', [
              'Tagy: ',
              h.data.tags.map(t => `#${t}`).join(', ')
            ])
          ]) : '' */
        ] : ''
      ])
    ])
  }
}

const TwoPanesFeed = {
  view (vnode) {
    if (!data.articles) {
      return m('.m-5', 'Načítám obsah ...')
    }
    return [
      m(FeedHeader, { data, query: vnode.attrs }),
      m(Feed, { maxi: true, items: data.articles })
    ]
  }
}

const App = {
  oninit: (vnode) => {
    opts = vnode.attrs
    loadData()
  },
  onupdate: (vnode) => {
    console.log('@', JSON.stringify(opts), JSON.stringify(vnode.attrs))
    if (JSON.stringify(opts) !== JSON.stringify(vnode.attrs)) {
      console.log('x', opts, vnode.attrs)
      opts = vnode.attrs
      loadData(true)
    }
  },
  onremove: () => {
    opts = {}
    selected = null
  },
  view: (vnode) => {
    return [
      m('header.flex.h-12.bg-gray-100.items-center.border.border-t-0.border-l-0.border-r-0', m(Header, vnode.attrs)),
      m('section.absolute.left-0.right-0.bottom-0', { style: 'top: 3rem;' }, [
        m('section.absolute.top-0.bottom-0.left-0.w-full.lg:w-4/6', [
          m('div.absolute.inset-0', [
            m('div.absolute.inset-0.overflow-hidden', [
              m('div.absolute.inset-0.overflow-scroll.pb-10', m(TwoPanesFeed, vnode.attrs))
            ])
          ])
        ]),
        m('section.absolute.inset-y-0.right-0.bg-gray-200.hidden.lg:block.w-2/6.border.border-t-0.border-r-0.border-b-0', [
          m('h2.px-5.pt-3.pb-3.font-bold.text-lg.border.border-t-0.border-l-0.border-r-0.border-dashed', 'Důležité zprávy'),
          m('div.overflow-hidden.absolute.left-0.right-0.bottom-0', { style: 'top: 3.5rem;' }, [
            m('div.overflow-scroll.absolute.inset-0.pb-10', m(Feed, { important: true, items: data.important }))
          ])
        ])
      ])
    ]
  }
}

function consoleComponentRoute (cmp) {
  return {
    render: (vnode) => {
      return m(Console.Layout, { options }, m(Console[cmp], vnode.attrs))
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

const Core = {
  view (vnode) {
    return m('div', [
      // bl0k.tooltip ? m(Tooltip, { data: bl0k.tooltip }) : '',
      m('div', vnode.children)
    ])
  }
}

function componentRoute (cmp, layout = true) {
  return {
    render: (vnode) => {
      let out = m(cmp, vnode.attrs)
      if (layout) {
        out = m(Layout, { options }, out)
      }
      return m(Core, out)
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
