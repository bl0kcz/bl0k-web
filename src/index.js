/* globals twttr */
const m = require('mithril')
const dateFns = require('date-fns')

const API_URL = 'https://api.bl0k.cz/1'

let articles = []

function formatDate (input) {
  const d = new Date(input)
  const time = dateFns.format(d, 'HH:mm')
  if (dateFns.isToday(d)) {
    return time
  }
  if (dateFns.isYesterday(d)) {
    return `včera ${time}`
  }
  return `${dateFns.format(d, 'd.M.')} ${time}`
}

function articleLink (item, text) {
  return m(m.route.Link, { href: `/zpravy/${item.id}/${item.slug}` }, text)
}

function loadData (refresh = false) {
  if (refresh) {
    articles = []
    m.redraw()
  }
  m.request(`${API_URL}/articles`).then(data => {
    articles = data
    m.redraw()
    setTimeout(() => {
      twttr.widgets.load()
    }, 100)
  })
}

function reload () {
  loadData(true)
  return false
}

const Header = {
  view: () => {
    return [
      m('h1.mx-5.text-left.text-xl', m('a', { href: '/', style: 'font-family: monospace;', onclick: reload }, 'bl0k.cz'))
      // m('p.text-sm', 'Rychlé zprávy z kryptoměn')
    ]
  }
}

const Feed = {
  view: () => {
    if (articles.length === 0) {
      return m('.p-5', 'Načítám obsah ...')
    }
    return articles.important.map(i => {
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
    if (articles.length === 0) {
      return m('.p-5', 'Načítám obsah ...')
    }
    return articles.articles.map(i => {
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
  oninit: () => {
    loadData()
  },
  view: () => {
    return [
      m('header.flex.h-12.bg-gray-100.items-center', m(Header)),
      m('section.absolute.left-0.right-0.bottom-0', { style: 'top: 3rem;' }, [
        m('section.absolute.top-0.bottom-0.left-0.w-full.lg:w-4/6', [
          m('div.absolute.inset-0', [
            m('div.absolute.inset-0.overflow-hidden', [
              m('div.absolute.inset-0.overflow-scroll', m(FeedBig))
            ])
          ])
        ]),
        m('section.absolute.inset-y-0.right-0.bg-gray-200.hidden.lg:block.w-2/6', [
          m('h2.p-5.font-bold.text-lg', 'Důležité zprávy'),
          m('div.overflow-hidden.absolute.left-0.right-0.bottom-0', { style: 'top: 3.5rem;' }, [
            m('div.overflow-scroll.absolute.inset-0.pb-10', m(Feed))
          ])
        ])
      ])
    ]
  }
}

m.mount(document.getElementById('app'), App)
