const { $bl0k, m } = require('../lib/bl0k')

const { Header } = require('./Headers')
const { Feed, TwoPanesFeed } = require('./Feed')
const Infobar = require('./Infobar')

let opts = {}

module.exports = {
  oninit: (vnode) => {
    this.opts = vnode.attrs
    $bl0k.fetchData('bundle', this.opts)
  },
  onupdate: (vnode) => {
    if (JSON.stringify(this.opts) !== JSON.stringify(vnode.attrs)) {
      this.opts = vnode.attrs
      $bl0k.fetchData('bundle', this.opts)
    }
  },
  onremove: () => {
    opts = {}
    $bl0k.set('feed.selected', null)
  },
  view: (vnode) => {
    const important = $bl0k.data('important')

    return [
      m(Infobar),
      m('header.flex.h-12.bg-gray-100.items-center.border.border-t-0.border-l-0.border-r-0', m(Header, vnode.attrs)),
      m('section.absolute.left-0.right-0.bottom-0.mt-20.top-0', [
        m('section.absolute.top-0.bottom-0.left-0.w-full.lg:w-4/6', [
          m('div.absolute.inset-0', [
            m('div.absolute.inset-0.overflow-hidden', [
              m('div.absolute.inset-0.overflow-scroll.pb-10', m(TwoPanesFeed, Object.assign({ opts }, vnode.attrs)))
            ])
          ])
        ]),
        m('section.absolute.inset-y-0.right-0.bg-gray-200.hidden.lg:block.w-2/6.border.border-t-0.border-r-0.border-b-0', [
          m('h2.px-5.pt-3.pb-3.font-bold.text-lg.border.border-t-0.border-l-0.border-r-0.border-dashed', 'Důležité zprávy'),
          m('div.overflow-hidden.absolute.left-0.right-0.bottom-0', { style: 'top: 3.5rem;' }, [
            m('div.overflow-scroll.absolute.inset-0.pb-10', m(Feed, { important: true, items: important, opts }))
          ])
        ])
      ])
    ]
  }
}
