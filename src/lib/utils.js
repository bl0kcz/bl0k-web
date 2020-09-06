import { isToday, isYesterday, format } from 'date-fns'
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

module.exports = {
  formatDate
}
