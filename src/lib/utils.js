const dateFns = require('date-fns')
const m = require('mithril')

function formatDate (input, todayTitle = false) {
  const d = new Date(input)
  const time = dateFns.format(d, 'HH:mm')

  let str = ''
  if (dateFns.isToday(d)) {
    str = todayTitle ? `dnes ${time}` : time
  } else if (dateFns.isYesterday(d)) {
    str = `včera ${time}`
  } else {
    str = `${dateFns.format(d, 'd.M.')} ${time}`
  }
  return m('span', { title: dateFns.format(d, 'd.M.yyyy HH:mm') }, str)
}

module.exports = {
  formatDate
}
