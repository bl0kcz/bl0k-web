const { $bl0k, m } = require('../lib/bl0k')

module.exports = {

  wrap (inside, right) {
    return m('.h-8.w-full.bg-gray-700.border.border-gray-300', [
      m('.w-full.h-8.flex.items-center.px-2.md:px-4.text-xs.text-gray-300.whitespace-no-wrap', [
        m('.w-5/6.md:w-4/6.flex.items-center', inside),
        m('.w-1/6.md:w-2/6.flex.justify-end.items-center', right)
      ])
    ])
  },

  view () {
    const base = m('div.text-gray-600', '.... ... .. .')
    const online = $bl0k.data('online')
    const d = $bl0k.data('infobar')
    const conn = $bl0k.ws.connected
    const connColor = conn === null ? 'text-gray-500' : (conn ? 'text-green-600' : 'text-red-600')
    const connTitle = conn === null ? 'automatické připojení po 5s' : (conn ? 'připojený' : 'odpojený')
    const connText = conn === null ? '' : (conn ? '' : 'odpojený')
    const right = [
      online && online.connected ? m('.mr-3', [
        m.trust(`<i class="fas fa-user mr-1"></i><b>${online.connected}</b>`)
      ]) : '',
      m('div', [
        m(`i.fas.fa-circle.${connColor}`, { title: connTitle }),
        connText ? m('span.hidden.md:inline-block.ml-1', connText) : ''
      ])
    ]
    if (!d || !d.gasnow) {
      return this.wrap(base, right)
    }
    const ethPrice = d.cg_eth.market_data.current_price.usd
    const ethChange = Math.round(d.cg_eth.market_data.price_change_percentage_24h * 10) / 10
    const ethChangePerc = (ethChange > 0 ? '+' : '') + ethChange
    const btcPrice = d.cg_btc.market_data.current_price.usd
    const btcChange = Math.round(d.cg_btc.market_data.price_change_percentage_24h * 10) / 10
    const btcChangePerc = (btcChange > 0 ? '+' : '') + btcChange
    const ethFee = Math.round(d.gasnow.list.find(i => i.index === 500).gasPrice / 10e6) / 100
    const btcFee = Math.round(d.mempool.halfHourFee * 100) / 100

    // https://bitcoinops.org/en/tools/calc-size/
    // 248 vbyte jako na https://mempool.space/
    const btcFeeUSD = $bl0k.utils.formatAmount(btcFee / 1e8 * btcPrice * 248)
    const ethFeeUSD = $bl0k.utils.formatAmount(ethFee / 1e9 * ethPrice * 21000)

    function item (x) {
      return m((x.noPadding ? (x.noPaddingLeft || '.pl-1') : '.pl-2.md:pl-3.lg:pl-4') + (x.hidden ? '.hidden.md:block' : ''),
        m('a', { href: x.url, target: '_blank', rel: 'noopener' }, [
          x.ico ? m(`i.fab.${x.ico}.mr-1`) : '',
          x.render ? m.trust(x.render()) : m('span.font-bold', $bl0k.utils.formatAmount(x.amount)
          )]
        ))
    }

    return this.wrap([
      item({
        noPadding: true,
        ico: 'fa-bitcoin',
        url: 'https://cryptowat.ch/charts/BINANCE:BTC-USDT',
        amount: btcPrice
      }),
      item({
        noPadding: true,
        url: 'https://cryptowat.ch/charts/BINANCE:BTC-USDT',
        render: () => `<div class="hidden md:inline-block"> <span class="${btcChange > 0 ? 'text-green-500' : 'text-red-500'}">${btcChangePerc}%</span></div>`
      }),
      item({
        ico: 'fa-ethereum',
        url: 'https://cryptowat.ch/charts/BINANCE:ETH-USDT',
        amount: ethPrice
      }),
      item({
        noPadding: true,
        url: 'https://cryptowat.ch/charts/BINANCE:ETH-USDT',
        render: () => `<div class="hidden md:inline-block"> <span class="${ethChange > 0 ? 'text-green-500' : 'text-red-500'}">${ethChangePerc}%</span></div>`
      }),
      item({
        ico: 'fa-gas-pump',
        // noPadding: true,
        url: 'https://mempool.space/',
        render: () => ` <b>${btcFee}</b> sat<span class="hidden md:inline">/vB</span><span class="hidden md:inline text-gray-500"> ~${btcFeeUSD}</span>`
        // hidden: true
      }),
      item({
        // ico: 'fa-gas-pump',
        noPadding: true,
        noPaddingLeft: '.pl-2',
        url: 'https://www.gasnow.org/',
        render: () => `<b>${ethFee}</b> Gwei<span class="hidden md:inline text-gray-500"> ~${ethFeeUSD}</span>`
        // hidden: true
      })
    ], right)
  }
}
