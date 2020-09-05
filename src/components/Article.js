/* globals confirm */
const m = require('mithril')
const ArticleContent = require('./ArticleContent')
const { formatDate } = require('../lib/utils')
const jsondiffpatch = require('jsondiffpatch')
const dateFns = require('date-fns')

const data = {}

function loadArticle (id) {
  const query = 'history=true&introspection=true'
  window.bl0k.request(`/article/${id}?${query}`).then(out => {
    data.article = out
    const text = data.article.html.replace(/(<([^>]+)>)/gi, '')
    window.bl0k.setPageDetail({ title: text, desc: text })
    m.redraw()

    if (m.route.get() !== data.article.url) {
      m.route.set(data.article.url)
      return null
    }
  })
}

function deleteComment (id) {
  return () => {
    if (!confirm(`Opravdu smazat komentář "${id}"?`)) {
      return false
    }
    window.bl0k.request({
      method: 'DELETE',
      url: `/article/${data.article.id}/comment/${id}`
    }).then(() => {
      loadArticle(data.article.id)
    })
    return false
  }
}

const Comment = {
  text: '',
  setText: function () {
    return (e) => {
      this.text = e.target.value
    }
  },
  textKey: function () {
    return (e) => {
      if (e.keyCode === 13 && !e.shiftKey) {
        this.submit()
        return false
      }
    }
  },
  submit: function () {
    window.bl0k.request({
      method: 'POST',
      url: `/article/${data.article.id}/comment`,
      body: {
        text: Comment.text
      }
    }).then(out => {
      Comment.text = ''
      loadArticle(data.article.id)
    })
    return false
  }
}

const ITable = {
  view (vnode) {
    const cols = vnode.attrs.cols
    return m('table.w-full.table-auto.border.mb-2', [
      // m('thead', [ ]),
      m('tbody', cols.map(c => {
        return m('tr.table-row', [
          m('th.w-1/6.px-4.py-2.text-right.border.border-gray-300.bg-gray-100.text-sm', c.title),
          m('td.w-5/6.px-4.py-2.border.border-gray-200.break-all', c.val)
        ])
      }))
    ])
  }
}

const ArticleIntrospection = {
  link (target, text = null, mono = false) {
    if (text === null) {
      text = target
    }
    const cl = `text-sm text-red-700 hover:underline ${mono ? 'font-mono text-lg' : ''}`
    if (target.substring(0, 1) === '/') {
      return m(m.route.Link, { href: target, class: cl }, text)
    }
    return m('a', { href: target, class: cl, target: '_blank' }, text)
  },
  view (vnode) {
    const a = vnode.attrs.item
    const cols = [
      { title: 'ID', val: m('b.font-mono.text-lg', a.id) },
      { title: 'sID', val: this.link(`/${a.sid}`, a.sid, true) },
      { title: 'URL', val: this.link(a.url) },
      { title: 'Status', val: m('b.font-mono.text-lg', a.type) },
      { title: 'Autor', val: [this.link(`/u/${a.author.username}`, `@${a.author.username}`), ' (', m('span.font-mono.text-lg', a.author.id), ')'] },
      { title: 'Vytvořeno', val: dateFns.format(new Date(a.date), 'd.M.yyyy HH:mm') + ' (' + dateFns.formatDistanceToNow(new Date(a.date)) + ' zpět)' },
      { title: 'Duležitá zpráva', val: a.important ? m('b', 'ano') : 'ne' },
      { title: 'Zdrojový text', val: m('.font-mono.py-2.px-3.border.rounded-lg', a.data.text) },
      { title: 'Čistý text', val: m('.font-mono.py-2.px-3.border.rounded-lg', a.rendered.card.text) },
      { title: 'Délka čistého textu', val: a.rendered.card.text.length + ' znaků' },
      { title: 'Chainy', val: a.chains.map(t => t.name).join(', ') },
      { title: 'Tagy', val: a.tags.map(t => `#${t}`).join(', ') },
      {
        title: 'Zdroje',
        val: a.sources.map(s => {
          return m(ITable, {
            cols: [
              { title: 'Type', val: m('span.font-mono.text-lg', s.name) },
              { title: 'URL', val: this.link(s.url) }
            ]
          })
        })
      },
      {
        title: 'Odkazy',
        val: a.links.map(i => {
          return m(ITable, {
            cols: [
              { title: 'URL', val: this.link(i.url) },
              { title: 'sURL', val: this.link(i.surl) },
              { title: 'Link ID', val: m('span.font-mono.text-lg', i.link) }
            ]
          })
        })
      }
    ]
    return m(ITable, { cols })
  }
}

module.exports = {

  oninit (vnode) {
    this.id = '0x' + vnode.attrs.id
    this.showHistory = false
    loadArticle(this.id)
  },
  onremove (vnode) {
    data.article = null
  },
  view (vnode) {
    if (!data.article) {
      return m('.flex.w-full.justify-center.m-5', 'Loading ..')
    }
    // const links = data.article.links
    const user = window.bl0k.auth ? window.bl0k.auth.user : null
    const history = (user && (user.admin || data.article.author.id === user.id) && data.article.history) ? [...data.article.history].reverse() : null

    return m('.w-full.flex.justify-center.mb-10', [
      m('.w-full.md:w-5/6.lg:w-4/6.p-5.sm:mt-5', [
        m('.mb-8.p-3.lg:p-5.border.rounded', [
          m('article.text-xl', m(ArticleContent, { item: data.article, standalone: true }))
        ]),
        /* links.length > 0 ? m('.block', [
          m('h2.text-lg', 'Odkazy'),
          m('.p-5', links.map(l => {
            return m('.mb-2.break-all', ['•', m('a.hover:underline.ml-3', { href: l.surl, target: '_blank' }, l.url)])
          }))
        ]) : '', */

        (data.article.type === 'draft' && data.article.comments.length === 0) ? '' : m('.mb-5', [
          m('h2.text-lg', `Komentáře (${data.article.comments.length})`),
          (data.article.comments.length < 1 && !user) ? '' : m('.pt-3', data.article.comments.map(c => {
            const canModify = user && (c.author.id === user.id || user.admin)
            const html = window.bl0k.tooltipProcess(c.html)

            return m('.my-2.md:mx-2.flex.bl0k-comment.w-full.md:mt-3', [
              m('.block', m('.w-8.h-8.mr-2.mt-2.rounded-full', { style: `background: url(${c.author.avatar}); background-size: 100% 100%;` })),
              m('.ml-2.w-full', [
                m('.flex.items-center', [
                  m('.inline.text-sm.font-bold', m(m.route.Link, { href: `/u/${c.author.username}`, class: 'hover:underline' }, c.author.username)),
                  m('.inline.ml-3.text-xs.text-gray-700', formatDate(c.created, true)),
                  !canModify ? '' : m('a.hover:underline.text-red-700.ml-3.text-xs.bl0k-comment-control', { onclick: deleteComment(c.id), href: '#' }, 'Smazat')
                ]),
                m('.mt-1.break-words.w-11/12.bl0k-comment-content.bl0k-base-html', m.trust(html))
              ])
            ])
          })),
          user ? '' : m('.mt-8.text-gray-700', 'Nové komentáře mohou psát jen přihlášení uživatelé.'),
          // m('.mt-5', 'Žádný komentář nenalezen'),
          window.bl0k.auth ? m('form.flex.mt-5.md:mx-2', { onsubmit: Comment.submit }, [
            m('.block', m('.w-8.h-8.mr-3.mt-1.rounded-full', { style: `background: url(${window.bl0k.auth.user.avatar}); background-size: 100% 100%;` })),
            m('.block.w-1/2', [
              m('textarea.w-full.form-textarea.mr-2', { oninput: Comment.setText(), onkeypress: Comment.textKey(), value: Comment.text, placeholder: 'Váš komentář ..', rows: Comment.text.split('\n').length })
            ]),
            m('.w-auto', [
              m('button.ml-2.bg-blue-500.hover:bg-blue-700.text-white.py-2.px-4.rounded.mr-2.text-md', 'Odeslat')
            ])
          ]) : ''
        ]),
        (!history || history.length < 1) ? '' : m('.block.mt-5.lg:mt-10', [
          m('h2.text-lg.flex.items-center', [
            `Historie úprav (${history.length})`,
            m('.text-sm.ml-5', [
              m('a.hover:underline', { href: '#', onclick: () => { (this.showHistory = !this.showHistory); return false } }, `${!this.showHistory ? 'Zobrazit' : 'Skrýt'} historii`)
            ])
          ]),
          !this.showHistory ? '' : m('.pt-3', history.map(h => {
            const actions = {
              created: ['vytvořil ', m('span.text-orange-700.font-bold', 'koncept')],
              updated: 'upravil zprávu',
              'status:in-queue': ['přesunul zprávu do ', m('span.text-blue-700.font-bold', 'fronty')],
              'status:public': [m('span.text-green-700.font-bold', 'zveřejnil'), ' zprávu'],
              'status:draft': [m('span.text-red-700.font-bold', 'zamítnul'), ' zprávu']
            }

            return m('.my-2.md:mx-2.mb-5', [
              m('.flex.items-center', [
                m('.block.w-12.md:w-24.text-sm.text-right.mr-3', formatDate(h.created)),
                // m('.block', JSON.stringify(h, null, 2))
                m('.block', m('.w-6.h-6.rounded-full', { style: `background: url(${h.author.avatar}); background-size: 100% 100%;` })),
                m('.block.ml-2', m(m.route.Link, { href: '', class: 'hover:underline font-bold' }, h.author.username)),
                m('.block.ml-2', [
                  m('.inline', actions[h.action])
                ])
              ]),
              h.diff ? m('.block.ml-0.md:ml-32.mt-3', [
                m('.relative.block.px-2.py-3.border.rounded.overflow-hidden',
                  m.trust(jsondiffpatch.formatters.html.format(h.diff, h.data))
                )
              ]) : ''
            ])
          }))
        ]),
        !(user && user.admin) ? '' : m('.hidden.md:block.mt-5.lg:mt-10.', [
          m('h2.text-lg.flex.items-center', 'Introspekce zprávy'),
          m('.block.pt-3', m(ArticleIntrospection, { item: data.article }))
        ])
      ])
    ])
  }
}
