const m = require('mithril')
const { formatDate } = require('../lib/utils')

function articleLink (item, text) {
  return m(m.route.Link, { href: item.url, class: 'hover:underline' }, text)
}

function chainTopic (chains, article = {}) {
  return (article.standalone ? chains : chains.slice(0, 1)).map(chain => {
    return m(m.route.Link, { href: `/chain/${chain.id}`, class: 'hover:underline mr-2 inline' }, chain.name)
  })
}

function tagsTopic (tags, article = {}) {
  return (article.standalone ? tags : tags.slice(0, 1)).map(t => m(m.route.Link, { href: `/t/${t}`, class: 'hover:underline mr-2 inline' }, `#${t}`))
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
        allowModify ? m(m.route.Link, { class: 'bl0k-article-control ml-5 hover:underline', href: `/console/edit/${item.id}` }, 'Upravit') : '',
        allowModify ? m('a', { class: 'bl0k-article-control ml-5 hover:underline text-red-700', href: '#', onclick: () => window.bl0k.deleteArticle(item) }, 'Smazat') : '',
        allowModify && item.type === 'draft' ? m('a', { class: 'bl0k-article-control ml-5 hover:underline text-green-700', href: '#', onclick: () => window.bl0k.changeArticleType(item, 'in-queue') }, 'Do fronty') : '',
        admin ? m('a', { class: 'bl0k-article-control ml-5 hover:underline text-green-700 font-semibold', href: '#', onclick: () => window.bl0k.changeArticleType(item, 'public') }, 'Publikovat') : ''
        // m(m.route.Link, { class: 'ml-5 hover:underline', href: `/report/${item.id}` }, 'Nahlásit')
      ])
    ])
  }
}

module.exports = {
  oninit (vnode) {
    this.item = vnode.attrs.item
    this.important = vnode.attrs.important
    this.maxi = vnode.attrs.maxi
    this.standalone = vnode.attrs.standalone
  },
  view (vnode) {
    const i = this.item
    const embedAllowed = !this.important || i.importantEmbed === true
    const types = {
      'in-queue': { text: 've frontě', color: 'bg-green-300.text-green-700' },
      draft: { text: 'koncept', color: 'bg-blue-300.text-blue-700' }
    }
    const typeBadge = i.type !== 'public' ? m('.inline-block.px-2.py-1.mb-2.mr-5.rounded-md.' + types[i.type].color, types[i.type].text) : ''

    let baseHtml = i.html.trim().match(/^<p>([\s\S]*?)<\/p>$/m)
    if (!baseHtml) {
      console.error(`corrupted html: ${i.id}, html: "${i.html}"`)
      baseHtml = ['', 'n/a']
    }
    const htmlArr = [m.trust(baseHtml[1])]

    if (i.comments.length > 0 && !this.standalone) {
      let str = 'komenáře'
      if (i.comments.length === 1) {
        str = 'komentář'
      } else if (i.comments.length > 4) {
        str = 'komentářů'
      }
      htmlArr.push(m('.inline.ml-3.text-sm.whitespace-no-wrap', ['💬 ', m(m.route.Link, { href: i.url, class: 'bl0k-comments-link hover:underline text-gray-700' }, `${i.comments.length} ${str}`)]))
    }

    const parts = {
      header: m(`div.font-bold.pb-${this.standalone ? 5 : 2}.text-sm.flex`, [
        typeBadge,
        m('span', articleLink(i, formatDate(i.date))),
        m('span.pl-3', chainTopic(i.chains, this)),
        m('span.pl-3.font-normal.text-gray-700', tagsTopic(i.tags, this))
      ]),
      content: [
        m('.content', m('.break-words', htmlArr)),
        i.embed && i.embed.tweet && embedAllowed ? m('div.flex.justify-center.mt-1', [m('.pt-0', m.trust(i.embed.tweet))]) : '',
        (vnode.attrs.selected === `${this.maxi ? 'ax' : 'a'}:${i.id}` || this.standalone || i.type !== 'public') ? m(`.pt-${this.standalone ? 2 : 0}`, m(DetailBox, { item: i, standalone: this.standalone })) : ''
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
