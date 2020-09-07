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
  'solid/gas-pump',
  'brands/facebook-f',
  'brands/twitter',
  ['src/assets/images/logo-blok', 'bl0k'],
  ['src/assets/images/logo-blok-mini', 'bl0k-mini'],
  ['src/assets/images/bl0k-logo', 'bl0k-new']
]

// const startUnicode = 0xea01
const startUnicode = 0xf001

const iconsFiles = iconsList.map(i => {
  if (Array.isArray(i)) {
    return i[0] + '.svg'
  }
  return `node_modules/@fortawesome/fontawesome-free/svgs/${i}.svg`
})

webfont({
  files: iconsFiles,
  fontName: 'bl0k-icons',
  startUnicode,
  sort: false,
  centerHorizontally: true,
  normalize: true,
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
      const cl = Array.isArray(iconsList[i]) ? iconsList[i][1] : iconsList[i].split('/')[1]
      css.push(`.fa-${cl}:before { content: "\\${Number(startUnicode + i).toString(16)}"; }`)
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
