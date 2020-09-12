
const { m } = require('../lib/bl0k')

const SimpleLayout = {
  view (vnode) {
    return m('.flex.w-full.justify-center', m('.lg:w-4/6', vnode.children))
  }
}

module.exports = {
  SimpleLayout
}
