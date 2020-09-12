
const { $bl0k, m } = require('../lib/bl0k')

function articleLink (item, text) {
  return m(m.route.Link, { href: item.url, class: 'hover:underline' }, text)
}

function chainTopic (chains, article = {}) {
  return (article.standalone ? chains : chains.slice(0, 1)).map(chain => {
    return m(m.route.Link, { href: `/chain/${chain ? chain.id : chain}`, class: 'hover:underline mr-2 inline' }, chain ? chain.name : chain)
  })
}

function tagsTopic (tags, article = {}) {
  return (article.standalone ? tags : tags.slice(0, 1)).map(t => m(m.route.Link, { href: `/t/${t}`, class: 'hover:underline mr-2 inline' }, `#${t}`))
}

const DetailBox = {
  view (vnode) {
    const item = vnode.attrs.item
    const auth = $bl0k.auth
    const admin = auth && (auth.user && auth.user.admin)
    const allowModify = auth && (auth.userId === item.author.id || admin)
    const fullUrl = 'https://bl0k.cz/' + item.sid
    const std = vnode.attrs.standalone

    return m('.w-full.mt-5', [
      m('.text-sm.flex.w-full.h-auto.items-center', [
        m('.flex.w-4/6.md:w-5/6.h-auto.items-center', [
          // m('span.text-xs', item.id),
          m(m.route.Link, { class: 'w-6 h-6 mr-3', href: `/u/${item.author.username}` }, m('.inline-block.h-full.w-full.rounded-full', { style: `background: url(${item.author.avatar}); background-size: 100% 100%;` })),
          m('span.font-semibold', item.author ? m(m.route.Link, { href: `/u/${item.author.username}`, class: 'hover:underline text-md' }, `${item.author.username}`) : ''),
          // (std || item.type === 'draft') ? '' : m(m.route.Link, { class: 'ml-6 hover:underline', href: item.url }, 'Přidat komentář'),
          // m(m.route.Link, { class: 'ml-5 hover:underline', href: item.surl }, 'Shortlink'),
          m(m.route.Link, { class: 'bl0k-article-control ml-5 hover:underline text-gray-700 hover:text-black', href: `/create?thread=${item.id}`, title: 'Navázat novou zprávu' }, m('i.fas.fa-stream.text')),
          allowModify ? m(m.route.Link, { class: 'bl0k-article-control ml-5 hover:underline text-gray-700 hover:text-black', href: `/edit/${item.sid}`, title: 'Upravit' }, [m('i.fas.fa-edit.text'), std || item.type !== 'public' ? m('span.ml-2', 'Upravit') : '']) : '',
          allowModify ? m('a', { class: 'bl0k-article-control ml-5 hover:underline text-gray-700 hover:text-black', href: '#', title: 'Smazat', onclick: () => $bl0k.actions.deleteArticle(item) }, [m('i.fas.fa-trash-alt.text'), std ? m('span.ml-2', 'Smazat') : '']) : '',
          allowModify && item.type === 'draft' ? m('a', { class: 'bl0k-article-control ml-5 hover:underline hover:text-blue-900 text-blue-700', title: 'Do fronty', href: '#', onclick: () => $bl0k.actions.changeArticleType(item, 'in-queue') }, [m('i.fas.fa-check'), std || item.type === 'draft' ? m('span.ml-2', 'Do fronty') : '']) : '',
          admin && item.type !== 'public' ? m('a', { class: 'bl0k-article-control ml-5 hover:underline hover:text-green-900 text-green-700 font-semibold', title: 'Publikovat', href: '#', onclick: () => $bl0k.actions.changeArticleType(item, 'public') }, [m('i.fas.fa-check-double'), std || item.type === 'in-queue' ? m('span.ml-2', 'Publikovat') : '']) : '',
          admin && item.type === 'in-queue' ? m('a', { class: 'bl0k-article-control ml-5 hover:underline hover:text-red-900 text-red-700 font-semibold', title: 'Zamítnout', href: '#', onclick: () => $bl0k.actions.changeArticleType(item, 'draft') }, [m('i.fas.fa-times-circle'), std || item.type === 'in-queue' ? m('span.ml-2', 'Zamítnout') : '']) : ''
          // m(m.route.Link, { class: 'ml-5 hover:underline', href: `/report/${item.id}` }, 'Nahlásit')
        ]),
        item.type === 'public' ? m('.flex.w-2/6.md:1/6.h-auto.items-center.justify-end.text-white.text-md', [
          m('a.w-10.h-10.flex.items-center.justify-center.bg-gray-500.hover:bg-gray-600', { href: fullUrl, target: '_blank' }, m('.fas.fa-link.bl0k-no-click')),
          m('a.w-10.h-10.flex.items-center.justify-center.bg-fb.hover:bg-fb-dark.ml-1', { href: 'http://www.facebook.com/sharer/sharer.php?u=' + fullUrl, target: '_blank', rel: 'noopener' }, m('.fab.fa-facebook-f.bl0k-no-click')),
          m('a.w-10.h-10.flex.items-center.justify-center.bg-tw.hover:bg-tw-dark.ml-1', { href: 'http://www.twitter.com/share?url=' + fullUrl, target: '_blank', rel: 'noopener' }, m('.fab.fa-twitter.bl0k-no-click'))
        ]) : ''
      ])
    ])
  }
}

/* const TwitterEmbed = {
  oncreate (vnode) {
    if (window.twttr && twttr.widgets) {
      twttr.widgets.load(vnode.dom)
    }
  },
  oninit (vnode) {
    const embed = vnode.attrs.embed
    this.html = m.trust(embed.html)

    // const tid = embed.meta.url.match(/\/(\d+)\/?$/)[1]
    // this.iframeUrl = `https://platform.twitter.com/embed/index.html?dnt=false&embedId=twitter-widget-0&frame=false&hideCard=false&hideThread=false&id=${tid}&lang=cs&origin=https%3A%2F%2Fbl0k.cz%2F&siteScreenName=bl0kcz&theme=light&widgetsVersion=219d021%3A1598982042171&width=550px`
  },
  view (vnode) {
    return m('.block', { style: 'max-width: 550px;' }, this.html)
  }
} */

const TwitterScreenEmbed = {
  oninit (vnode) {
    this.id = vnode.attrs.embed.meta.url.match(/(\d+)$/)[1]
    this.imageSrc = `https://bl0k.cz/static/tweets/${this.id}.png`
  },
  view (vnode) {
    return m('a.mt-3', { href: vnode.attrs.embed.meta.url, target: '_blank', rel: 'noopener', style: 'image-rendering: high-quality;' },
      m('img.bl0k-no-click', { style: 'width: 500px', src: this.imageSrc, alt: `Tweet ${this.id}` })
    )
  }
}

const BaseHtml = {
  oncreate (vnode) {
    this.current = vnode.attrs.text
    vnode.dom.innerHTML = this.current
  },
  onupdate (vnode) {
    if (this.current !== vnode.attrs.text) {
      this.current = vnode.attrs.text
      vnode.dom.innerHTML = this.current
    }
  },
  view () {
    return m('.bl0k-base-html')
  }
}

const SocialBar = {
  view (vnode) {
    const i = vnode.attrs.item
    const stndl = vnode.attrs.standalone
    const output = []
    const userLiked = (i.userState && i.userState.like) || ($bl0k.auth && i.likes && i.likes.find(l => l.author === $bl0k.auth.userId))
    const userHover = $bl0k.auth
    output.push(m('.mr-5.transition.duration-200' + (userHover ? '.hover:text-red-700.cursor-pointer' : '') + (i.likesCount > 0 ? '.text-gray-700' : ''), { href: '#', class: userLiked ? 'text-blue-500 font-bold' : '', onclick: () => $bl0k.actions.likeArticle(i) }, [m('i.fas.fa-fire.mr-2'), m('span.text-sm', i.likesCount)]))
    // output.push(m('a.mr-5.hover:underline', { href: '#' }, [ m('i.fas.fa-bookmark.mr-1'), '' ]))

    // let cstr = i.commentsCount > 0 ? m('.text-gray-700', i.commentsCount) : '0'
    /* if (i.commentsCount > 0 && !this.standalone) {
      cstr = `${i.commentsCount} komenáře`
      if (i.commentsCount === 1) {
        cstr = `${i.commentsCount} komentář`
      } else if (i.commentsCount > 4) {
        cstr = `${i.commentsCount} komentářů`
      }
    } */

    output.push(m(stndl ? 'span' : m.route.Link, { href: i.url, class: 'bl0k-comments-link' + (stndl ? '' : ' transition duration-200 hover:text-red-700') + (i.commentsCount > 0 ? ' text-gray-700' : '') }, m('.whitespace-no-wrap', [m('i.fas.fa-comment.mr-2'), m('span.text-sm', i.commentsCount)])))

    return m('.text-gray-400.text-md.mt-2.ml-5.flex', output)
  }
}

module.exports = {
  oninit (vnode) {
    this.initData(vnode)
  },

  onupdate (vnode) {
    if (JSON.stringify(this.item) !== JSON.stringify(vnode.attrs.item)) {
      this.initData(vnode)
      m.redraw()
    }
  },

  initData (vnode) {
    this.item = vnode.attrs.item
    this.important = vnode.attrs.important
    this.maxi = vnode.attrs.maxi
    this.standalone = vnode.attrs.standalone

    const i = this.item
    const types = {
      'in-queue': { text: 've frontě', color: 'bg-blue-300.text-blue-700' },
      draft: { text: 'koncept', color: 'bg-orange-300.text-orange-700' }
    }
    this.typeBadge = i.type !== 'public' ? m('.inline-block.px-2.py-1.mb-2.mr-5.rounded-md.' + types[i.type].color, types[i.type].text) : ''

    let baseHtml = i.html.trim().match(/^<p>([\s\S]*?)<\/p>$/m)[1]
    baseHtml = $bl0k.tooltipProcess(baseHtml)

    for (const s of i.sources) {
      if (i.embeds && i.embeds[0] && i.embeds[0].meta.url === s.url) {
        continue
      }
      baseHtml += ` (<a class="bl0k-article-source" target="_blank" rel="noopener" href="${s.url}">${s.name}</a>)`
    }

    if (!baseHtml) {
      console.error(`corrupted html: ${i.id}, html: "${i.html}"`)
      baseHtml = 'n/a'
    }
    this.htmlArr = [m(BaseHtml, { text: baseHtml })]
  },

  view (vnode) {
    const i = this.item
    // const embedAllowed = !this.important || i.importantEmbed === true

    const parts = {
      header: m(`div.font-bold.${this.standalone ? 'pb-5' : 'pb-2'}.text-sm.flex.flex-wrap.w-full`, [
        this.typeBadge,
        m('.whitespace-no-wrap', articleLink(i, $bl0k.utils.formatDate(i.date))),
        m('.pl-3', chainTopic(i.chains, this)),
        m('.pl-3.font-normal.text-gray-700', tagsTopic(i.tags, this))
      ]),
      content: [
        this.item.thread ? m('.text-sm.mb-3', [m('i.fas.fa-stream.mr-2'), m(m.route.Link, { href: this.item.thread.url, class: 'hover:underline' }, this.item.thread.card.stitle)]) : '',
        m('.content', m('.break-words', this.htmlArr)),
        this.item.type !== 'draft' ? m(SocialBar, { item: this.item, standalone: this.standalone }) : '',
        m('.flex.justify-center', i.embeds.map(embed => {
          if (embed.type === 'twitter') {
            return m(TwitterScreenEmbed, { embed })
            // return m(TwitterEmbed, { embed })
          }
        })),
        // i.embed && i.embed.tweet && embedAllowed ? m('div.flex.justify-center.mt-1', [m('.pt-0', m.trust(i.embed.tweet))]) : '',
        (vnode.attrs.selected === `${this.maxi ? 'ax' : 'a'}:${i.id}` || this.standalone || i.type !== 'public') ? m(`.${this.standalone ? 'pt-2' : 'pt-0'}`, m(DetailBox, { item: i, standalone: this.standalone })) : ''
      ]
    }

    if (this.maxi) {
      parts.header = m('.inline-block.lg:block.lg:w-1/6.text-sm.font-bold.leading-6.pr-2.pb-2.lg:pb-0', [
        this.typeBadge,
        m('.inline-block.lg:block.whitespace-no-wrap', articleLink(i, $bl0k.utils.formatDate(i.date))),
        m('.inline-block.lg:block.pl-3.lg:pl-0', chainTopic(i.chains, this)),
        m('.inline-block.lg:block.pl-3.lg:pl-0.font-normal.text-gray-700', tagsTopic(i.tags, this))
      ])
      parts.content = m('.inline-block.w-full.lg:w-auto.lg:block.lg:w-5/6', parts.content)
    }

    return [parts.header, parts.content]
  }
}
