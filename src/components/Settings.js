
const { m, $bl0k } = require('../lib/bl0k')
const jsondiffpatch = require('jsondiffpatch')

module.exports = {

  oninit () {
    this.input = null
    this.inputUsername = null
    this.inputErrorCols = []
    this.data = {}
    this.loadUser()
  },

  loadUser (reload = true) {
    this.input = null
    this.inputUsername = null
    this.data = {}
    m.redraw()

    $bl0k.request({
      url: '/me'
    }).then(out => {
      this.data.user = out
      $bl0k.setPageDetail({ title: 'Nastavení' })
      m.redraw()
    })
  },

  saveUsername () {
    $bl0k.request({
      method: 'POST',
      url: '/settings',
      body: {
        username: this.inputUsername.text
      }
    }).then(out => {
      if (out.error) {
        this.usernameError = out.error
        return null
      }
      this.loadUser(true)
    })
    return false
  },

  saveProfile () {
    const data = {}
    for (const k of Object.keys(this.input)) {
      const val = this.input[k]
      data[k] = val === '' ? null : val
    }
    $bl0k.request({
      method: 'POST',
      url: '/settings',
      body: { data }
    }).then(out => {
      if (out.error) {
        this.inputError = out.error
        this.inputErrorCols = out.errorCols
        return null
      }
      this.loadUser(true)
    })
    return false
  },

  view () {
    const auth = $bl0k.auth
    if (!auth || !auth.user || !this.data.user) {
      return m('.m-5', 'Načítám ..')
    }
    const user = this.data.user
    const self = this

    if (!this.input) {
      this.inputUsername = {
        text: user.username,
        set (e) {
          self.usernameError = null
          this.text = e.target.value
        }
      }
      this.input = Object.assign({}, {
        setProperty (prop) {
          return (e) => {
            self.inputError = null
            self.inputErrorCols = []
            this[prop] = e.target.value
          }
        }
      }, user.data)
    }
    const usernameChanged = this.inputUsername.text && this.data.user.username !== this.inputUsername.text
    const inputChanged = jsondiffpatch.diff(user.data, JSON.parse(JSON.stringify(this.input)))

    return m('.m-5', [
      m('.flex.w-full.justify-center', [
        m('.w-full.lg:w-4/6.lg:mt-2.mb-10', [
          m('.text-2xl.pb-2', 'Nastavení účtu'),
          m('form.block.w-full.rounded.bg-gray-200.p-5', { onsubmit: this.saveUsername.bind(this) }, [
            m('label.block', [
              m('span.text-gray-700', 'Uživatelské jméno'),
              m('input.form-input.mt-1.block.w-full', {
                oninput: this.inputUsername.set.bind(this.inputUsername),
                value: this.inputUsername.text,
                class: this.usernameError ? 'border-red-700' : ''
              }),
              m('.text-sm.mt-1.text-gray-600', 'Délka musí být 3 - 24 znaků, povolené znaky: a-z, A-Z, 0-9, _ (bez diakritiky)')
            ]),
            m('.flex.items-center.mt-5', [
              !usernameChanged ? '' : m(`button.text-white.py-2.px-4.rounded.${!this.usernameError ? 'bg-blue-500.hover:bg-blue-700' : 'bg-gray-500'}`, { onclick: this.saveUsername.bind(this), disabled: this.usernameError ? 'disabled' : '' }, 'Změnit'),
              !this.usernameError ? '' : m('.text-red-700.ml-3.text-sm', this.usernameError)
            ])
          ]),
          m('.text-2xl.pb-2.mt-10', 'Profil'),
          m('.text-sm.mb-3', ['Všechny profilové údaje jsou ', m('span.font-bold', 'nepovinné.')]),
          m('form.block.w-full.rounded.bg-gray-200.p-5', { onsubmit: this.saveProfile.bind(this) }, [
            m('label.block', [
              m('span.text-gray-700', 'Celé jméno'),
              m('input.form-input.mt-1.block.w-full', {
                oninput: this.input.setProperty('fullName'),
                value: this.input.fullName,
                class: this.inputErrorCols.includes('.fullName') ? 'border-red-700' : ''
              })
            ]),
            m('label.block.mt-5', [
              m('span.text-gray-700', 'Avatar - URL adresa obrázku'),
              m('input.form-input.mt-1.block.w-full', {
                oninput: this.input.setProperty('avatarUrl'),
                value: this.input.avatarUrl,
                class: this.inputErrorCols.includes('.avatarUrl') ? 'border-red-700' : ''
              })
            ]),
            m('label.block.mt-5', [
              m('span.text-gray-700', 'Web - URL adresa'),
              m('input.form-input.mt-1.block.w-full', {
                oninput: this.input.setProperty('webUrl'),
                value: this.input.webUrl,
                class: this.inputErrorCols.includes('.webUrl') ? 'border-red-700' : ''
              })
            ]),
            m('label.block.mt-5', [
              m('span.text-gray-700', 'Twitter - uživatelské jméno'),
              m('input.form-input.mt-1.block.w-full', {
                oninput: this.input.setProperty('twitterUsername'),
                value: this.input.twitterUsername,
                class: this.inputErrorCols.includes('.twitterUsername') ? 'border-red-700' : ''
              }),
              m('.text-sm.mt-1.text-gray-600', 'Bez @, např. "bl0kcz"')
            ]),
            m('label.block.mt-5', [
              m('span.text-gray-700', 'Profilový text'),
              m('textarea.form-textarea.mt-1.block.w-full.font-mono.text-lg', {
                placeholder: 'Tady můžete napsat něco o sobě ..',
                oninput: this.input.setProperty('text'),
                value: this.input.text,
                rows: Math.max(3, this.input.text ? this.input.text.split('\n').length : 0),
                class: this.inputErrorCols.includes('.text') ? 'border-red-700' : ''
              }),
              m('.mt-1.mb-5.text-sm.text-gray-600', [
                'Text je ve formátu ',
                m('a.text-blue-700.hover:underline', { href: 'http://www.edgering.org/markdown/', target: '_blank', rel: 'noopener' }, 'Markdown'),
                '.'
              ])
            ]),
            m('.flex.items-center.mt-5', [
              !inputChanged ? '' : m(`button.text-white.py-2.px-4.rounded.${!this.usernameError ? 'bg-blue-500.hover:bg-blue-700' : 'bg-gray-500'}`, { onclick: this.saveProfile.bind(this), disabled: this.inputError ? 'disabled' : '' }, 'Změnit'),
              !this.inputError ? '' : m('.text-red-700.ml-3.text-sm', this.inputError)
            ])
          ])
        ])
      ])
    ])
  }
}
