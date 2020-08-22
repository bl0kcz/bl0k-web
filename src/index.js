/* globals twttr */
const m = require('mithril')
const dateFns = require('date-fns')
const qs = require('querystring')

const API_URL = 'https://api.bl0k.cz/1'

let opts = {}
let dataLoading = false
let data = {
  articles: [],
  important: [],
  chains: {},
  menu: []
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
  return m(m.route.Link, { href: `/zpravy/${item.id}/${item.slug}` }, text)
}

function loadData (refresh = false) {
  dataLoading = true
  if (refresh) {
    data.articles = []
    data.important = []
    m.redraw()
  }
  const query = {}
  if (opts.chain) {
    query.chain = opts.chain
  }
  m.request(`${API_URL}/articles?${qs.stringify(query)}`).then(out => {
    data = out
    dataLoading = false
    m.redraw()
    setTimeout(() => {
      twttr.widgets.load()
    }, 100)

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

const Logo = {
  view () {
    return m('span.mx-5.text-xl.pr-3', m(m.route.Link, { href: '/', style: 'font-family: monospace;', onclick: reload }, 'bl0k.cz'))
  }
}

const Header = {
  view: (vnode) => {
    return [
      m('h1', m(Logo)),
      m('.text-sm', data.menu.map(mi => {
        const name = mi.chain.name
        /* if (mi.chain.ico) {
          name = [ m(`i.pr-1.${mi.chain.ico}`, { style: 'font-family: cryptofont' } ), name ]
        } */
        if (vnode.attrs.chain === mi.chainId || (mi.chainId === 'all' && !vnode.attrs.chain)) {
          return m('span.underline.font-semibold.pr-3', name)
        }
        return m('.hidden.lg:inline-block', m(m.route.Link, { href: mi.url ? mi.url : `/chain/${mi.chainId}`, class: 'pr-3' }, name))
      })),
      m('.absolute.top-0.right-0.h-12.flex.items-center', [
        m('.text-sm.pr-5', [
          m('div', m(m.route.Link, { href: '/p/o-nas' }, m.trust('Co je to bl0k?')))
        ])
      ])
      // m('p.text-sm', 'Rychlé zprávy z kryptoměn')
    ]
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
      return m('article.px-5.pt-5.pb-2', [
        m('div.font-bold.pb-2.text-sm', [
          m('span', articleLink(i, formatDate(i.date))),
          m('span.pl-3', i.topic)
        ]),
        m('.content', m.trust(i.html)),
        i.embed && i.embed.tweet && i.importantEmbed !== false ? m('div', [
          m('.pt-2', m.trust(i.embed.tweet))
        ]) : ''
      ])
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
      return m('article.lg:flex.px-5.pt-5.pb-2', { id: i.id }, [
        m('.inline-block.lg:block.lg:w-1/6.text-sm.font-bold.leading-6.pr-2.pb-2', [
          m('.inline-block.lg:block', articleLink(i, formatDate(i.date))),
          m('.inline-block.lg:block.pl-3.lg:pl-0', i.topic)
        ]),
        m('.inline-block.lg:block.lg:w-5/6', [
          m('.content', [
            m.trust(i.html)
          ]),
          i.embed && i.embed.tweet ? m('div', [
            m('.pt-2', m.trust(i.embed.tweet))
          ]) : ''
        ])
      ])
    })
  }
}

const App = {
  oninit: (vnode) => {
    opts = vnode.attrs
    loadData()
  },
  onupdate: (vnode) => {
    console.log('opts:', opts)
    if (JSON.stringify(opts) !== JSON.stringify(vnode.attrs)) {
      opts = vnode.attrs
      loadData(true)
    }
  },
  view: (vnode) => {
    return [
      m('header.flex.h-12.bg-gray-100.items-center', m(Header, vnode.attrs)),
      m('section.absolute.left-0.right-0.bottom-0', { style: 'top: 3rem;' }, [
        m('section.absolute.top-0.bottom-0.left-0.w-full.lg:w-4/6', [
          m('div.absolute.inset-0', [
            m('div.absolute.inset-0.overflow-hidden', [
              m('div.absolute.inset-0.overflow-scroll.pb-10', m(FeedBig, vnode.attrs))
            ])
          ])
        ]),
        m('section.absolute.inset-y-0.right-0.bg-gray-200.hidden.lg:block.w-2/6', [
          m('h2.p-5.font-bold.text-lg', 'Důležité zprávy'),
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
  m.request(`${API_URL}/page?${qs.stringify(query)}`).then(out => {
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
      m('.h-12.items-center.flex.bg-gray-100', [
        m('h1', m(Logo)),
        m('span.pl-3.text-sm', m(m.route.Link, { href: '/' }, '← Zpět na zprávy'))
      ]),
      m('.p-5', m({
        view () {
          if (!page || pageLoading) {
            return m('div', 'Načítám stránku')
          }
          return m('.markdown-body', m.trust(page.html))
        }
      }))
    ]
  }
}

const root = document.getElementById('app')
m.route(root, '/', {
  '/': App,
  '/chain/:chain': App,
  '/p/:page': PageApp
})
