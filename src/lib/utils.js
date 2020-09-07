import { isToday, isYesterday, format } from 'date-fns'
const currency = require('currency.js')
const m = require('mithril')

function formatDate (input, todayTitle = false) {
  const d = new Date(input)
  const time = format(d, 'HH:mm')

  let str = ''
  if (isToday(d)) {
    str = todayTitle ? `dnes ${time}` : time
  } else if (isYesterday(d)) {
    str = `včera ${time}`
  } else {
    str = `${format(d, 'd.M.')} ${time}`
  }
  return m('span', { title: format(d, 'd.M.yyyy HH:mm') }, str)
}

function formatAmount (amount, precision = 2, preset = 'usd') {
  const presets = {
    usd: { separator: ' ', decimal: ',', pattern: '# !', symbol: ' $' },
    czk: { separator: ' ', decimal: ',', pattern: '# !', symbol: ' Kč' }
  }
  return currency(amount, Object.assign({}, presets[preset], { precision })).format()
}

function shortSentences (str, max = 100) {
  if (str.length < max) {
    return str
  }
  const out = []
  let count = 0
  for (const s of str.split(' ')) {
    count += s.length + 1
    if (count > max) {
      break
    }
    out.push(s)
  }
  return out.join(' ') + '..'
}

module.exports = {
  formatDate,
  formatAmount,
  shortSentences
}
