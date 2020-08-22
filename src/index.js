const m = require('mithril')
const dateFns = require('date-fns')

let articles = null

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

function loadData (refresh = false) {
  if (refresh) {
    articles = null
    m.redraw()
  }
  m.request('http://localhost:3000/1/articles').then(data => {
    articles = data
    m.redraw()
    setTimeout(() => {
      twttr.widgets.load()
    }, 100)
  })
}

const Header = {
  oninit: () => {
    loadData()
  },
  view: () => {
    return [
      m('h1.mx-5.text-left.text-xl', m('a', { href: '/', style: 'font-family: monospace;', onclick: reload }, 'bl0k.cz')),
      m('p.text-sm', 'Rychlé zprávy z kryptoměn'),
    ]
  }
}

const Feed = {
  view: () => {
    if (!articles) {
      return m('.p-5', 'Načítám obsah ...')
    }
    return articles.important.map(i => {
      return m('article.px-5.pt-5.pb-2', [
        m('div.font-bold.pb-2.text-sm', [
          m('span', formatDate(i.date)),
          m('span.pl-3', i.topic),
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
    if (!articles) {
      return m('.p-5', 'Načítám obsah ...')
    }
    return articles.articles.map(i => {
      return m('article.flex.p-5', [
        m('.w-1/6.text-sm.font-bold.leading-6.pr-2', [
          m('p', formatDate(i.date)),
          m('p', i.topic)
        ]),
        m('.w-5/6', [
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

function reload () {
  loadData(true)
  return false;
}


m.mount(document.getElementById('feed'), Feed)
m.mount(document.getElementById('feed-big'), FeedBig)
m.mount(document.getElementById('header'), Header)
