/* globals twttr, localStorage, web3, alert, ethereum, confirm, location */
const m = require('mithril')
const dateFns = require('date-fns')
const qs = require('querystring')

const Console = require('./components/console')
const { SimpleHeader, Logo, AuthPart } = require('./components/headers')

const options = {
  apiUrl: 'https://api.bl0k.cz/1',
  title: 'bl0k.cz - Rychlé zprávy z kryptoměn',
  titleSuffix: 'bl0k.cz',
  desc: 'Komunitní zpravodajský server pro odbornou veřejnost zaměřený na krátké technologické zprávy ze světa kryptoměn.'
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

const bl0k = window.bl0k = {
  auth: null,
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
    // window.bl0k.auth = null
    location.reload()
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
    const desc = input.desc ? shortSentences(input.title, 165) : null

    // apply
    document.title = (title ? (title + ' - ' + options.titleSuffix) : options.title)
    document.getElementsByTagName('meta')['twitter:title'].content = title
    if (desc) {
      document.getElementsByTagName('meta')['twitter:description'].content = desc
    }
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

function formatDate (input) {
  const d = new Date(input)
  const time = dateFns.format(d, 'HH:mm')

  let str = ''
  if (dateFns.isToday(d)) {
    str = time
  } else if (dateFns.isYesterday(d)) {
    str = `včera ${time}`
  } else {
    str = `${dateFns.format(d, 'd.M.')} ${time}`
  }
  return m('span', { title: dateFns.format(d, 'd.M.yyyy HH:mm') }, str)
}

function articleLink (item, text) {
  return m(m.route.Link, { href: item.url, class: 'hover:underline' }, text)
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
  if (opts.tag) {
    query.tag = opts.tag
  }
  window.bl0k.request(`${options.apiUrl}/bundle?${qs.stringify(query)}`).then(out => {
    data = out
    dataLoading = false

    window.bl0k.setPageDetail({
      title: opts.chain && data.chains[opts.chain] ? data.chains[opts.chain].name : null
    })

    m.redraw()
    setTimeout(() => {
      twttr.widgets.load()
    }, 100)

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
      data.menu.push({ chainId, chain })
    }
    data.menu.push({ chainId: 'oth', chain: { name: 'Ostatní' } })
  })
}

const Header = {
  view: (vnode) => {
    return [
      m('h1', m(Logo, { loadStatus })),
      m('.text-sm', data.menu.map(mi => {
        const name = mi.chain.name
        /* if (mi.chain.ico) {
          name = [ m(`i.pr-1.${mi.chain.ico}`, { style: 'font-family: cryptofont' } ), name ]
        } */
        if (vnode.attrs.chain === mi.chainId || (mi.chainId === 'all' && !vnode.attrs.chain)) {
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

function chainTopic (chains, article = {}) {
  return (article.standalone ? chains : chains.slice(0, 1)).map(chain => {
    return m(m.route.Link, { href: `/chain/${chain.id}`, class: 'hover:underline mr-2 inline' }, chain.name)
  })
}

function tagsTopic (tags, article = {}) {
  return (article.standalone ? tags : tags.slice(0, 1)).map(t => m(m.route.Link, { href: `/t/${t}`, class: 'hover:underline mr-2 inline' }, `#${t}`))
}

let selected = null
function selectItem (id) {
  return (e) => {
    if (e.target.nodeName === 'A') {
      return true
    }
    selected = (selected === id) ? null : id
    console.log('Selected: ' + selected)
    return false
  }
}

const DetailBox = {
  view (vnode) {
    const item = vnode.attrs.item
    const auth = window.bl0k.auth
    const admin = auth && (auth.user && auth.user.admin)
    const allowModify = auth && (auth.userId === item.author.id || admin)

    return m('.w-full.mt-5', [
      m('.text-sm.flex.w-full.h-auto.items-center', [
        // m('span.text-xs', item.id),
        m(m.route.Link, { class: 'w-6 h-6 mr-3', href: `/u/${item.author.username}` }, m('.inline-block.h-full.w-full.rounded-full', { style: `background: url(${item.author.avatar}); background-size: 100% 100%;` })),
        m('span.font-semibold', item.author ? m(m.route.Link, { href: `/u/${item.author.username}`, class: 'hover:underline text-md' }, `${item.author.username}`) : ''),
        vnode.attrs.standalone ? '' : m(m.route.Link, { class: 'ml-6 hover:underline', href: item.url }, 'Permalink'),
        // m(m.route.Link, { class: 'ml-5 hover:underline', href: item.surl }, 'Shortlink'),
        allowModify ? m(m.route.Link, { class: 'ml-5 hover:underline', href: `/console/edit/${item.id}` }, 'Upravit') : '',
        allowModify ? m('a', { class: 'ml-5 hover:underline text-red-700', href: '#', onclick: () => window.bl0k.deleteArticle(item) }, 'Smazat') : '',
        allowModify && item.type === 'draft' ? m('a', { class: 'ml-5 hover:underline text-green-700', href: '#', onclick: () => window.bl0k.changeArticleType(item, 'in-queue') }, 'Do fronty') : '',
        admin ? m('a', { class: 'ml-5 hover:underline text-green-700 font-semibold', href: '#', onclick: () => window.bl0k.changeArticleType(item, 'public') }, 'Publikovat') : ''
        // m(m.route.Link, { class: 'ml-5 hover:underline', href: `/report/${item.id}` }, 'Nahlásit')
      ])
    ])
  }
}

const ArticleContent = {
  oninit (vnode) {
    this.item = vnode.attrs.item
    this.important = vnode.attrs.important
    this.maxi = vnode.attrs.maxi
    this.standalone = vnode.attrs.standalone
  },
  view () {
    const i = this.item
    const embedAllowed = !this.important || i.importantEmbed === true
    const types = {
      'in-queue': { text: 've frontě', color: 'bg-green-300.text-green-700' },
      draft: { text: 'koncept', color: 'bg-blue-300.text-blue-700' }
    }
    const typeBadge = i.type !== 'public' ? m('.inline-block.px-2.py-1.mb-2.mr-5.rounded-md.' + types[i.type].color, types[i.type].text) : ''

    const parts = {
      header: m(`div.font-bold.pb-${this.standalone ? 5 : 2}.text-sm`, [
        typeBadge,
        m('span', articleLink(i, formatDate(i.date))),
        m('span.pl-3', chainTopic(i.chains, this)),
        m('span.pl-3.font-normal.text-gray-700', tagsTopic(i.tags, this))
      ]),
      content: [
        m('.content', m.trust(i.html)),
        i.embed && i.embed.tweet && embedAllowed ? m('div.flex.justify-center.mt-1', [m('.pt-0', m.trust(i.embed.tweet))]) : '',
        (selected === `${this.maxi ? 'ax' : 'a'}:${i.id}` || this.standalone || i.type !== 'public') ? m(`.pt-${this.standalone ? 2 : 0}`, m(DetailBox, { item: i, standalone: this.standalone })) : ''
      ]
    }

    if (this.maxi) {
      parts.header = m('.inline-block.lg:block.lg:w-1/6.text-sm.font-bold.leading-6.pr-2.pb-2.lg:pb-0', [
        typeBadge,
        m('.inline-block.lg:block', articleLink(i, formatDate(i.date))),
        m('.inline-block.lg:block.pl-3.lg:pl-0', chainTopic(i.chains, this)),
        m('.inline-block.lg:block.pl-3.lg:pl-0.font-normal.text-gray-700', tagsTopic(i.tags, this))
      ])
      parts.content = m('.inline-block.lg:block.lg:w-5/6', parts.content)
    }

    return [parts.header, parts.content]
  }
}

const InfoPanel = {
  view () {
    return m('.p-5', [
      m('.bg-teal-100.border-t-4.border-teal-500.rounded-b.text-teal-900.px-4.py-3', { role: 'alert' }, [
        m('.flex', [
          m('.py-1', m('svg.fill-current.h-6.w-6.text-teal-500.mr-4', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20' }, m('path', { d: 'M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z' }))),
          m('div', [
            m('p.font-bold', 'Vítejte na bl0k.cz!'),
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
    return [
      (opts.chain || opts.tag || important || window.bl0k.auth) ? '' : m(InfoPanel),
      m('div', items.map(i => {
        const bg = ((type) => {
          switch (type) {
            case 'draft':
              return 'bg-blue-200'
            case 'in-queue':
              return 'bg-green-200'
          }
          return ''
        })(i.type)
        return m(`article.${important ? '' : 'lg:flex.'}.p-5.border.border-t-0.border-l-0.border-r-0.border-dashed.${bg || ''}`,
          { id: i.id, onclick: selectItem(`${maxi ? 'ax' : 'a'}:${i.id}`) }, m(ArticleContent, { item: i, maxi, important }))
      }))
    ]
  }
}

const FeedHeader = {
  view (vnode) {
    const h = vnode.attrs.data.header
    if (!h) {
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

const App = {
  oninit: (vnode) => {
    opts = vnode.attrs
    loadData()
  },
  onupdate: (vnode) => {
    if (JSON.stringify(opts) !== JSON.stringify(vnode.attrs)) {
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
              m('div.absolute.inset-0.overflow-scroll.pb-10', m({
                view () {
                  if (!data.articles) {
                    return m('.m-5', 'Načítám obsah ...')
                  }
                  return [
                    m(FeedHeader, { data, query: vnode.attrs }),
                    m(Feed, { maxi: true, items: data.articles })
                  ]
                }
              }))
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

let page = null
let pageId = null
let pageLoading = false

function loadPage () {
  pageLoading = true
  const query = { id: pageId }
  bl0k.request(`${options.apiUrl}/page?${qs.stringify(query)}`).then(out => {
    page = out
    pageLoading = false
    m.redraw()
  })
}

const PageApp = {
  oninit (vnode) {
    pageId = vnode.attrs.page
    loadPage()
  },
  view () {
    return [
      m(SimpleHeader, { name: pageId }),
      m('.p-5.flex.w-full.justify-center', m({
        view () {
          if (!page || pageLoading) {
            return m('div', 'Načítám stránku')
          }
          return m('.prose.mt-2.lg:w-4/6', m.trust(page.html))
        }
      }))
    ]
  }
}

function loadArticle (id) {
  window.bl0k.request(`${options.apiUrl}/article/${id}`).then(out => {
    data.article = out
    window.bl0k.setPageDetail({
      title: data.article.html.replace(/(<([^>]+)>)/gi, '')
    })
    m.redraw()

    if (m.route.get() !== data.article.url) {
      m.route.set(data.article.url)
      return null
    }
    setTimeout(() => {
      twttr.widgets.load()
    }, 100)
  })
}

/* const ArticleData = {
  comment: '',
  setProperty: function (prop) {
    return (e) => {
      this[prop] = e.target.value
      return true
    }
  }
} */

const Article = {
  oninit (vnode) {
    this.id = '0x' + vnode.attrs.id
    loadArticle(this.id)
  },
  onremove (vnode) {
    data.article = null
  },
  view (vnode) {
    return [
      m(SimpleHeader, { name: [m(m.route.Link, { href: `/${this.id}` }, m('pre.inline-block.ml-1.text-lg', this.id))] }),
      m({
        view () {
          if (!data.article) {
            return m('.flex.w-full.justify-center.m-5', 'Loading ..')
          }
          const links = data.article.links
          return m('.w-full.flex.justify-center', [
            m('.sm:w-4/6.m-5.sm:pt-5', [
              m('.mb-10', [
                m('article.text-xl', m(ArticleContent, { item: data.article, standalone: true }))
              ]),
              links.length > 0 ? m('.mb-5', [
                m('h2.text-lg', 'Odkazy'),
                m('.p-5', links.map(l => {
                  return m('.mb-2.break-all', ['•', m('a.hover:underline.ml-3', { href: l.surl, target: '_blank' }, l.url)])
                }))
              ]) : ''
              /* m('.mb-5', [
                m('h2.text-2xl', 'Komentáře (0)'),
                //m('.mt-5', 'Žádný komentář nenalezen'),
                m('form.lg:flex.mt-5', { onsubmit: () => false }, [
                  m('.w-4/6', [
                    m('textarea.w-full.form-textarea.mr-2', { oninput: (e) => { ArticleData.comment = e.target.value; return false; }, value: ArticleData.comment, placeholder: 'Váš komentář ..' }),
                  ]),
                  m('.w-auto', [
                    m('button.ml-2.bg-blue-500.hover:bg-blue-700.text-white.py-2.px-4.rounded.mr-2.text-md', 'Vložit komentář'),
                  ]),
                ]),
                m('p', '@@' + ArticleData.comment),
              ]) */
            ])
          ])
        }
      })
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

function componentRoute (cmp) {
  return {
    render: (vnode) => {
      return m(Layout, { options }, m(cmp, vnode.attrs))
    }
  }
}

const root = document.getElementById('app')
m.route(root, '/', {
  '/': App,
  '/0x:id': Article,
  '/0x:id/:slug': Article,
  '/chain/:chain': App,
  '/t/:tag': App,
  '/p/:page': PageApp,
  '/u/:user': componentRoute(require('./components/UserDetail')),
  '/settings': componentRoute(require('./components/Settings')),
  '/console': consoleComponentRoute('Dashboard'),
  '/console/new': consoleComponentRoute('Editor'),
  '/console/edit/:id': consoleComponentRoute('Editor')
})
