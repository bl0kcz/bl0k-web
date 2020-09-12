/* globals history */

const { $bl0k, m } = require('../lib/bl0k')

const { Header } = require('./Headers')
const { Feed, TwoPanesFeed } = require('./Feed')
const Infobar = require('./Infobar')

const saveScrollTimers = {}
const scrollElements = {}

const saveScroll = (type, offset) => {
  if (saveScrollTimers[type]) {
    clearTimeout(saveScrollTimers[type])
    saveScrollTimers[type] = null
  }

  saveScrollTimers[type] = setTimeout(data => {
    const state = history.state || {}
    if (!state.feeds) {
      state.feeds = {}
    }
    state.feeds[data.type] = { offset: data.offset }
    history.replaceState(state, null)
    // m.route.set(m.route.get(), null, { replace: true, state })

    console.log(`History State: ${JSON.stringify(history.state)}`)
  }, 250, { type, offset })
}

const initScroll = () => {
  if (!history.state || !history.state.feeds) {
    m.redraw()
    return null
  }
  const feedsState = history.state.feeds
  for (const type of Object.keys(feedsState)) {
    if (!scrollElements[type] || !feedsState[type]) {
      continue
    }
    const fs = feedsState[type]
    if (fs.offset) {
      setTimeout(() => {
        scrollElements[type].scrollTop = fs.offset
      }, 250)
    }
  }
}

const ScrollElement = {
  oncreate (vnode) {
    vnode.dom.addEventListener('scroll', e => {
      saveScroll(vnode.attrs.type, vnode.dom.scrollTop)
    })
    scrollElements[vnode.attrs.type] = vnode.dom
  },
  view (vnode) {
    return m('.bl0k-feed.absolute.inset-0.overflow-scroll.pb-10', vnode.children)
  }
}

function getOptions (obj) {
  return {
    chain: obj.chain,
    topic: obj.topic
  }
}

function loadData (vnode) {
  return $bl0k.fetchData('bundle', getOptions(vnode.state.opts))
    .then((bundle) => {
      $bl0k.setPageDetail({ title: bundle.header && bundle.header.data ? bundle.header.data.title : null })
      initScroll()
    })
}

module.exports = {

  oninit: (vnode) => {
    vnode.state.opts = vnode.attrs
    loadData(vnode)
  },
  onupdate: (vnode) => {
    if (JSON.stringify(getOptions(vnode.state.opts)) !== JSON.stringify(getOptions(vnode.attrs))) {
      vnode.state.opts = vnode.attrs
      loadData(vnode)
    }
  },
  onremove: (vnode) => {
    vnode.state.opts = {}
    $bl0k.set('feed.selected', null)
  },
  view: (vnode) => {
    const important = $bl0k.data('important')

    return [
      m(Infobar),
      m('header.flex.h-12.bg-gray-100.items-center.border.border-t-0.border-l-0.border-r-0', m(Header, vnode.attrs)),
      m('section.absolute.left-0.right-0.bottom-0.mt-20.top-0', [
        m('section.absolute.top-0.bottom-0.left-0.w-full.lg:w-4/6', [
          m('.absolute.inset-0', [
            m('.absolute.inset-0.overflow-hidden', [
              m(ScrollElement, { type: 'articles' }, m(TwoPanesFeed, vnode.attrs))
            ])
          ])
        ]),
        m('section.absolute.inset-y-0.right-0.bg-gray-200.hidden.lg:block.w-2/6.border.border-t-0.border-r-0.border-b-0', [
          m('h2.px-5.pt-3.pb-3.font-bold.text-lg.border.border-t-0.border-l-0.border-r-0.border-dashed', 'Důležité zprávy'),
          m('div.overflow-hidden.absolute.left-0.right-0.bottom-0', { style: 'top: 3.5rem;' }, [
            m(ScrollElement, { type: 'important' }, m(Feed, { important: true, items: important, opts: vnode.attrs }))
          ])
        ])
      ])
    ]
  }
}
