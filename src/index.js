/* globals twttr */
const m = require('mithril')
const dateFns = require('date-fns')
const qs = require('querystring')
const marked = require('marked')

const Console = require('./components/console')
const { SimpleHeader, Logo } = require('./components/headers')

const options = {
  apiUrl: 'https://api.bl0k.cz/1'
}

let opts = {}
let dataLoading = false
let data = {
  articles: [],
  article: null,
  important: [],
  chains: {},
  menu: []
}

const loadStatus = {
  items: [],
  start: function (j) { this.items.push(j) },
  end: function (j) { this.item.pop(j) },
  active: function () { return this.items.length > 0 }
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
    m.redraw()
  }
  const query = {}
  if (opts.chain) {
    query.chains = opts.chain
  }
  m.request(`${options.apiUrl}/bundle?${qs.stringify(query)}`).then(out => {
    data = out
    dataLoading = false
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

function reload () {
  loadData(true)
  return false
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
        m('.mr-5', m(m.route.Link, { href: '/console/new', class: 'py-4 hover:underline' }, m.trust('Přidat novou zprávu'))),
        m('div', m(m.route.Link, { href: '/p/o-nas', class: 'hover:underline' }, m.trust('Co je to bl0k?')))
      ])
      // m('p.text-sm', 'Rychlé zprávy z kryptoměn')
    ]
  }
}

function chainTopic (chains) {
  const ch = data.chains[chains[0]]
  if (!ch) {
    return 'n/a'
  }
  return m(m.route.Link, { href: `/chain/${ch.id}`, class: 'hover:underline' }, ch.name)
}

function tagsTopic (tags) {
  return tags[0] ? '#' + tags[0] : ''
}

let selected = null
function selectItem (id) {
  return (e) => {
    if (e.target.nodeName === 'A') {
      return true
    }
    selected = (selected === id) ? null : id
    return false
  }
}

const DetailBox = {
  view (vnode) {
    const item = vnode.attrs.item
    return m('.w-full.mt-5', [
      m('.text-sm', [
        // m('span.text-xs', item.id),
        m('span.font-semibold', item.author ? m(m.route.Link, { href: `/u/${item.author}`, class: 'hover:underline text-md' }, `@${item.author}`) : ''),
        m(m.route.Link, { class: 'ml-5 hover:underline', href: item.url }, 'Permalink'),
        // m(m.route.Link, { class: 'ml-5 hover:underline', href: item.surl }, 'Shortlink'),
        m(m.route.Link, { class: 'ml-5 hover:underline', href: `/console/edit/${item.id}` }, 'Upravit'),
        m(m.route.Link, { class: 'ml-5 hover:underline', href: `/report/${item.id}` }, 'Nahlásit')
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

    const parts = {
      header: m(`div.font-bold.pb-${this.standalone ? 5 : 2}.text-sm`, [
        m('span', articleLink(i, formatDate(i.date))),
        m('span.pl-3', chainTopic(i.chains)),
        m('span.pl-3.font-normal.text-gray-700', tagsTopic(i.tags))
      ]),
      content: [
        m('.content', m.trust(i.html)),
        (selected === `${this.maxi ? 'ax' : 'a'}:${i.id}` || this.standalone) ? m(`.pt-${this.standalone ? 2 : 0}`, m(DetailBox, { item: i })) : '',
        i.embed && i.embed.tweet && embedAllowed ? m('div.flex.justify-center.mt-5', [m('.pt-0', m.trust(i.embed.tweet))]) : ''
      ]
    }

    if (this.maxi) {
      parts.header = m('.inline-block.lg:block.lg:w-1/6.text-sm.font-bold.leading-6.pr-2.pb-2.lg:pb-0', [
        m('.inline-block.lg:block', articleLink(i, formatDate(i.date))),
        m('.inline-block.lg:block.pl-3.lg:pl-0', chainTopic(i.chains)),
        m('.inline-block.lg:block.pl-3.lg:pl-0.font-normal.text-gray-700', tagsTopic(i.tags))
      ])
      parts.content = m('.inline-block.lg:block.lg:w-5/6', parts.content)
    }

    return [parts.header, parts.content]
  }
}

const Feed = {
  view: () => {
    if (dataLoading) {
      return m('.p-5', 'Načítám obsah ...')
    }
    if (data.important.length === 0) {
      return m('.p-5', 'Nenalezeny žádné zprávy.')
    }
    return data.important.map(i => {
      return m('article.px-5.py-4.border.border-t-0.border-l-0.border-r-0.border-dashed',
        { id: i.id, onclick: selectItem(`a:${i.id}`) }, m(ArticleContent, { item: i, important: true }))
    })
  }
}

const FeedBig = {
  view: () => {
    if (dataLoading) {
      return m('.p-5', 'Načítám obsah ...')
    }
    if (data.articles.length === 0) {
      return m('.p-5', 'Nenalezeny žádné zprávy.')
    }
    return data.articles.map(i => {
      return m('article.lg:flex.p-5.border.border-t-0.border-l-0.border-r-0.border-dashed',
        { id: i.id, onclick: selectItem(`ax:${i.id}`) }, m(ArticleContent, { item: i, maxi: true }))
    })
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
              m('div.absolute.inset-0.overflow-scroll.pb-10', m(FeedBig, vnode.attrs))
            ])
          ])
        ]),
        m('section.absolute.inset-y-0.right-0.bg-gray-200.hidden.lg:block.w-2/6.border.border-t-0.border-r-0.border-b-0', [
          m('h2.px-5.pt-3.pb-3.font-bold.text-lg.border.border-t-0.border-l-0.border-r-0.border-dashed', 'Důležité zprávy'),
          m('div.overflow-hidden.absolute.left-0.right-0.bottom-0', { style: 'top: 3.5rem;' }, [
            m('div.overflow-scroll.absolute.inset-0.pb-10', m(Feed, vnode.attrs))
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
  m.request(`${options.apiUrl}/page?${qs.stringify(query)}`).then(out => {
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

function consoleComponentRoute (cmp) {
  return {
    render: (vnode) => {
      return m(Console.Layout, { options }, m(Console[cmp], vnode.attrs))
    }
  }
}

function loadArticle (id) {
  m.request(`${options.apiUrl}/article/${id}`).then(out => {
    data.article = out
    m.redraw()

    if (m.route.get() !== data.article.url) {
      m.route.set(data.article.url, { replace: true })
      return null
    }
    setTimeout(() => {
      twttr.widgets.load()
    }, 100)
  })
}

const Article = {
  oninit (vnode) {
    loadArticle(vnode.attrs.id)
  },
  onremove (vnode) {
    data.article = null
  },
  view (vnode) {
    return [
      m(SimpleHeader, { name: [m(m.route.Link, { href: `/z/${vnode.attrs.id}` }, m('pre.inline-block.ml-1.text-lg', vnode.attrs.id))] }),
      m({
        view () {
          if (!data.article) {
            return m('.flex.w-full.justify-center.m-5', 'Loading ..')
          }
          return m('.w-full.flex.justify-center', [
            m('.sm:w-4/6.m-5.sm:pt-5', [
              m('article.text-xl', m(ArticleContent, { item: data.article, standalone: true }))
            ])
          ])
        }
      })
    ]
  }
}

const root = document.getElementById('app')
m.route(root, '/', {
  '/': App,
  '/z/:id': Article,
  '/z/:id/:slug': Article,
  '/chain/:chain': App,
  '/p/:page': PageApp,
  '/console': consoleComponentRoute('Dashboard'),
  '/console/new': consoleComponentRoute('Editor'),
  '/console/edit/:id': consoleComponentRoute('Editor')
})
