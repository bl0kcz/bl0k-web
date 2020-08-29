
const m = require('mithril')

module.exports = {

  view () {
    const auth = window.bl0k.auth
    if (!auth || !auth.user) {
      return m('.m-5', 'Načítám ..')
    }
    const user = auth.user

    return m('.m-5', [
      m('.flex.w-full.justify-center', [
        m('.w-full.lg:w-4/6.lg:mt-2', [
          m('.text-2xl.pb-2', 'Nastavení účtu'),
          m('.block.w-full.rounded.bg-gray-200.p-5', [
            m('label.block', [
              m('span.text-gray-700', 'Uživatelské jméno'),
              m('input.form-input.mt-1.block.w-full', { value: user.username })
            ])
          ]),
          m('.text-2xl.pb-2.mt-10', 'Profil'),
          m('.block.w-full.rounded.bg-gray-200.p-5', [
            m('label.block', [
              m('span.text-gray-700', 'Avatar - URL adresa'),
              m('input.form-input.mt-1.block.w-full', { value: user.avatarUrl })
            ]),
            m('label.block.mt-5', [
              m('span.text-gray-700', 'Web - URL adresa'),
              m('input.form-input.mt-1.block.w-full', { value: user.web })
            ]),
            m('label.block.mt-5', [
              m('span.text-gray-700', 'Twitter - uživatelské jméno'),
              m('input.form-input.mt-1.block.w-full', { value: user.twitter })
            ])
          ])
        ])
      ])
    ])
  }
}
