const webfont = require('webfont').default
const fs = require('fs')

const iconsList = [
  'brands/bitcoin',
  'brands/ethereum',
  'solid/user',
  'solid/circle',
  'solid/link',
  'solid/edit',
  'solid/trash-alt',
  'brands/facebook-f',
  'brands/twitter'
]

// const startUnicode = 0xea01
const startUnicode = 0xf001
const startUnicodePrefix = 'f0'

const iconsFiles = iconsList.map(i => {
  return `node_modules/@fortawesome/fontawesome-free/svgs/${i}.svg`
})

webfont({
  files: iconsFiles,
  fontName: 'bl0k-icons',
  startUnicode,
  sort: false,
  // centerHorizontally: true,
  // normalize: true,
  fontWeight: 448,
  descent: 64
})
  .then(result => {
    console.log(result)
    const nm = 'src/assets/css/bl0k-icons'
    for (const ext of ['woff2', 'woff', 'eot', 'ttf', 'svg']) {
      const fn = `${nm}.${ext}`
      fs.writeFileSync(fn, result[ext])
      console.log(`writed: ${fn}`)
    }
    const css = []
    for (let i = 0; i < iconsList.length; i++) {
      css.push(`.fa-${iconsList[i].split('/')[1]}:before { content: "\\${startUnicodePrefix}${String(i + 1).padStart(2, '0')}"; }`)
    }
    const ifn = 'src/assets/css/bl0k-icons.css'
    fs.writeFileSync(ifn, css.join('\n'))
    console.log(`css index writed: ${ifn}`)
    return result
  })
  .catch(error => {
    console.error(error)
    throw error
  })
