/* globals alert */

import { formatDistanceToNow } from 'date-fns'

const { $bl0k, m } = require('../lib/bl0k')
const { SimpleHeader } = require('./Headers')
const marked = require('marked')
const FilePond = require('filepond')

const data = {}

const Layout = {
  oninit (vnode) {
    $bl0k.fetchData('base')
    data.options = vnode.attrs.options
  },

  view (vnode) {
    return [
      m(SimpleHeader, { name: m(m.route.Link, { class: 'hover:underline', href: '/console' }, 'Konzole') }),
      m('div', vnode.children)
    ]
  }
}

const UploadBlock = {
  oncreate (vnode) {
    FilePond.setOptions({
      server: $bl0k.options.apiUrl
    })
    this.pond = FilePond.create({
      allowMultiple: true,
      name: 'filepond'
    })
    vnode.dom.appendChild(this.pond.element)
  },
  view () {
    return m('div')
  }
}

const Message = {
  text: '',
  chains: '',
  tags: '',
  source: '',
  setProperty: function (prop) {
    return (e) => {
      this[prop] = e.target.value
      return true
    }
  },
  toAPIObject: function () {
    return {
      text: this.text,
      chains: this.chains.split(',').map(i => i.trim()).filter(i => i),
      tags: this.tags.split(',').map(i => i.trim()).filter(i => i),
      source: this.source
    }
  },
  reset: function () {
    this.text = ''
    this.chains = ''
    this.tags = ''
    this.source = ''
  }
}

let article = null

function loadArticle (id) {
  $bl0k.request(`/article/${id}?compat=false`).then(out => {
    article = out

    for (const col of ['text', 'tags', 'chains', 'source']) {
      if (col === 'chains' || col === 'tags') {
        Message[col] = article.data[col].join(',')
      } else {
        Message[col] = article.data[col]
      }
    }

    m.redraw()
  })
}

function createArticle () {
  $bl0k.request({
    method: 'POST',
    url: '/articles?compat=true',
    body: Message.toAPIObject()

  }).then(out => {
    m.route.set(`/z/${out.sid}`)
  })

  return false
}

function saveArticle () {
  if (!article) {
    return alert('No id!')
  }
  $bl0k.request({
    method: 'POST',
    url: `/article/${article.id}?compat=false`,
    body: Message.toAPIObject()

  }).then(out => {
    // article = out
    m.route.set(out.url)
    // m.redraw()
  })

  return false
}

function articleDiff () {
  if (!article) {
    return null
  }
  const msg = Message.toAPIObject()
  for (const c of Object.keys(msg)) {
    if (JSON.stringify(msg[c]) !== JSON.stringify(article.data[c])) {
      return true
    }
  }
  return false
}

const Editor = {
  oninit (vnode) {
    this.mode = vnode.attrs.id ? 'edit' : 'create'
    if (this.mode === 'edit') {
      loadArticle(vnode.attrs.id)
    }
  },

  onremove () {
    Message.reset()
    article = null
  },

  view (vnode) {
    const base = $bl0k.data('base')
    if (!base || (this.mode === 'edit' && !article)) {
      return m('.m-5', 'Loading ..')
    }

    let chainError = false
    const chains = Message.chains.split(',').map(i => i.trim().toLowerCase()).map(i => {
      if (i === '') {
        return null
      }
      const ch = base.chains[i]
      if (!ch) {
        chainError = `Neplatný blockchain: ${i}`
        return null
      }
      return ch.name
    })
    const tags = Message.tags.split(',').map(i => i.trim().toLowerCase()).map(i => `#${i}`)
    const diff = articleDiff()

    const auth = $bl0k.auth

    const saveEnabled = auth && ((this.mode === 'edit' && diff) || (this.mode === 'create' && Message.text))

    return [
      m('.flex.justify-center.pt-4.pb-10', [
        m('.lg:w-4/6.pt-2.sm:w-11/12.sm:px-0.px-5', [
          m('h2.text-2xl.pb-2', vnode.attrs.id ? ['Úprava zprávy ', m(m.route.Link, { class: 'font-mono text-3xl pl-2', href: article.url }, article.sid)] : 'Nová zpráva'),
          m('form.w-full.p-5.bg-gray-200.rounded', { onsubmit: () => false }, [
            m('label.block', [
              m('textarea.form-textarea.mt-1.block.w-full.font-mono.text-lg', { rows: 7, placeholder: 'Tady je místo pro vaši zprávu ..', oninput: Message.setProperty('text'), value: Message.text })
            ]),
            m('.mt-2.mb-5.text-sm.text-gray-600', [
              'Text je ve formátu ',
              m('a.text-blue-700.hover:underline', { href: 'http://www.edgering.org/markdown/', target: '_blank', rel: 'noopener' }, 'Markdown'),
              '. Základní formátování: ',
              m('span.font-mono.text-lg', '**tučně**, *kurzíva*, [odkaz](http://example.org)')
            ]),
            Message.text ? m('div', [
              m('.block.mt-5', [
                m('.inline.text-gray-700', [
                  'Relevantní blockchainy',
                  m('.inline.text-sm.ml-2', '- podle důležitosti, oddělené čárkou - např. "btc,eth"')
                ]),
                m('.flex.mt-2', [
                  m('input.form-input.block.w-2/6', { type: 'text', oninput: Message.setProperty('chains'), value: Message.chains }),
                  m('.w-4/6.pl-5.h-auto.items-center.flex', [
                    !chainError ? m('span', chains.join(', ')) : m('span.text-red-700', chainError)
                  ])
                ])
              ]),
              m('.block.mt-5', [
                m('.inline.text-gray-700', [
                  'Tagy',
                  m('.inline.text-sm.ml-2', '- podle důležitosti, oddělenné čárkou, např. "DeFi,burzy,parachain"')
                ]),
                m('.flex.mt-2', [
                  m('input.form-input.block.w-2/6', { type: 'text', oninput: Message.setProperty('tags'), value: Message.tags }),
                  m('.w-4/6.pl-5.h-auto.items-center.flex', [
                    m('span', tags.join(', '))
                  ])
                ])
              ]),
              m('.block.mt-5', [
                m('.inline.text-gray-700', [
                  'Zdroj',
                  m('.inline.text-sm.ml-2', '- URL adresa zdroje, např. tweetu či článku')
                ]),
                m('.flex.mt-2', [
                  m('input.form-input.block.w-full', { type: 'text', oninput: Message.setProperty('source'), value: Message.source })
                ])
              ]),
              /* m('.block.mt-5', [
                m('.inline.text-gray-700', [
                  'Přílohy',
                  m('.inline.text-sm.ml-2', '- obrázky')
                ]),
                m('.flex.mt-2', [
                  m('.w-full', m(UploadBlock))
                ])
              ]), */
              m('h2.text-xl.pt-5.pb-2', 'Náhled'),
              m('.p-5.rounded-lg.border.border-gray-400.bg-white', [
                m('article', [
                  m('.content', m.trust(marked(Message.text)))
                ])
              ])
            ]) : '',
            m('.mt-5.flex', [
              // m('div', 'diff=' + diff),
              m(`button.${saveEnabled ? 'bg-blue-500.hover:bg-blue-700' : 'bg-gray-400.cursor-not-allowed'}.text-white.py-2.px-4.rounded.transition.duration-200.ease-in-out`, { onclick: this.mode === 'create' ? createArticle : saveArticle, disabled: !saveEnabled ? 'disabled' : '' }, this.mode === 'edit' ? 'Uložit' : 'Vytvořit koncept')
            ]),
            auth ? '' : m('.mt-5.text-red-700', 'Pro vkládání a úpravu článků musíte být přihlášeni.')
          ])
          /* m('.mt-1', [
                m('label', [
                  m('input.form-checkbox', { type: 'checkbox' }),
                  m('span.ml-2', 'Ethereum')
                ]),
                m('
              ]) */
          /* m('form.w-full', [
            m('.flex.flex-wrap.-mx-3.mb-6', [
              m('.w-full.md:w-1/2.px-3.mb-6.md:mb-0', [
                m('label.block.uppercase.tracking-wide.text-gray-700.text-xs.font-bold.mb-2', { for: 'grid-first-name' }, 'First name'),
                m('input.appearance-none.block.w-full.bg-gray-200.text-gray-700.border.border-red-500.rounded.py-3.px-4.mb-3.leading-tight.focus:outline-none.focus:bg-white', { id: 'firstname', type: 'text', placeholder: 'Jane' }),
              ]),
              m('.w-full.md:w-1/2.px-3', [
                m('label.block.uppercase.tracking-wide.text-gray-700.text-xs.font-bold.mb-2', { for: 'grid-first-name' }, 'First name'),
                m('input.appearance-none.block.w-full.bg-gray-200.text-gray-700.border.border-red-500.rounded.py-3.px-4.mb-3.leading-tight.focus:outline-none.focus:bg-white', { id: 'firstname', type: 'text', placeholder: 'Jane' }),
              ])
            ])
          ]) */
        ])
      ])
    ]
  }
}

function loadBundle () {
  m.request(`${data.options.apiUrl}/console-bundle?compat=false`).then(out => {
    data.bundle = out
    m.redraw()
  })
}

const TableList = {
  view (vnode) {
    const items = vnode.attrs.items
    return m('table.w-full.table-auto.border', [
      /* m('thead', [
        m('tr', [
          m('th.py-2.px-4.font-normal.text-sm', 'Čas'),
          m('th.py-2.px-4.font-normal.text-sm', 'Zpráva'),
          m('th.py-2.px-4.font-normal.text-sm', 'Blockchainy')
        ])
      ]), */
      m('tbody', items.map(i => {
        return m('tr', [
          m('td.border.px-3.py-2.text-sm', [
            m('p', formatDistanceToNow(new Date(i.date))),
            m('p.text-xs', '@tree')
          ]),
          m('td.border.px-3.py-2.text-xs.max-w-xl', m('article', m('.content', m.trust(i.html)))),
          m('td.border.px-3.py-2.text-xs', [
            m('p', i.topic),
            i.tags ? m('p', i.tags.map(x => `#${x}`).join(', ')) : ''
          ]),
          m('td.px-3', [
            m(m.route.Link, { href: `/console/edit/${i.id}` }, m('button.bg-blue-500.hover:bg-blue-700.text-white.py-2.px-4.rounded.mr-2.text-sm.mt-1', 'Upravit')),
            vnode.attrs.type !== 'queue' ? '' : m(m.route.Link, { href: '/' }, m('button.bg-green-500.hover:bg-green-700.text-white.py-2.px-4.rounded.mr-2.text-sm.mt-1', 'Publikovat'))
          ]),
          m('td.px-3', [
          ])
        ])
      }))
    ])
  }
}

const Dashboard = {
  oninit () {
    loadBundle()
  },
  view () {
    if (!data.bundle) {
      return m('div.p-5', 'Loading ..')
    }

    return m('.p-5.mb-10', [
      m('h2.text-xl.mb-2', `Rozepsané zprávy (${data.bundle.drafts.length})`),
      m(TableList, { items: data.bundle.drafts, type: 'queue' }),
      m('h2.text-xl.mb-2.mt-5', `Zprávy ve frontě (${data.bundle.queue.length})`),
      m(TableList, { items: data.bundle.queue, type: 'queue' }),
      m('h2.text-xl.mb-2.mt-5', 'Vydané zprávy'),
      m(TableList, { items: data.bundle.published })
    ])
  }
}

module.exports = {
  Layout,
  Editor,
  Dashboard
}
