const { $bl0k, m } = require('../lib/bl0k')

const ArticleContent = require('./ArticleContent')

/* const InfoPanel = {
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
} */

function selectItem (id) {
  return (e) => {
    const classes = e.target.className.split(' ')
    if (e.target.nodeName === 'A' || e.target.parentElement.nodeName === 'A' ||
      classes.includes('bl0k-symbol') || classes.includes('bl0k-no-click')
    ) {
      return true
    }
    $bl0k.set('feed.selected', ($bl0k.store['feed.selected'] === id) ? null : id)
    console.log('Selected: ' + $bl0k.store['feed.selected'])
    return false
  }
}

const Feed = {
  view: (vnode) => {
    if (!vnode.attrs.items) {
      return m('.p-5', 'Načítám obsah ...')
    }
    const items = vnode.attrs.items
    const important = vnode.attrs.important
    const maxi = vnode.attrs.maxi
    if (items.length === 0) {
      return m('.p-5', 'Nenalezeny žádné zprávy.')
    }
    return m('div', [
      // (opts.chain || opts.topic || important || $bl0k.auth) ? '' : m(InfoPanel),
      items.map(i => {
        const bg = ((type) => {
          switch (type) {
            case 'draft':
              return 'bg-orange-200'
            case 'in-queue':
              return 'bg-blue-200'
          }
          return ''
        })(i.type)
        const fid = `${maxi ? 'ax' : 'a'}:${i.id}`
        return m('.h-full.w-full.bg-gradient-to-b.bg-transparent.hover:to-gray-200.hover:from-white.transition-all.duration-500.ease-in-out',
          m(`article.${important ? '' : 'lg:flex.'}.p-5.border.border-t-0.border-l-0.border-r-0.border-dashed.${bg || ''}`,
            { key: i.id, onclick: selectItem(fid) },
            m(ArticleContent, { item: i, maxi, important, selected: $bl0k.store['feed.selected'] })
          )
        )
      })
    ])
  }
}

const FeedHeader = {
  view (vnode) {
    const h = $bl0k.data('header')
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
    const articles = $bl0k.data('articles')
    return [
      m(FeedHeader, { query: vnode.attrs }),
      m(Feed, { maxi: true, items: articles, opts: vnode.attrs.opts })
    ]
  }
}

module.exports = {
  Feed,
  FeedHeader,
  TwoPanesFeed
}
