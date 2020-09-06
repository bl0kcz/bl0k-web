const m = require('mithril')

module.exports = {

  wrap (inside, right) {
    return m('.h-8.w-full.bg-gray-700.border.border-gray-300', [
      m('.w-full.h-8.flex.items-center.px-2.md:px-4.text-xs.text-gray-300', [
        m('.w-5/6.md:w-4/6.flex.items-center', inside),
        m('.w-1/6.md:w-2/6.flex.justify-end.items-center', right)
      ])
    ])
  },

  view () {
    const bl0k = window.bl0k
    const base = m('div.text-gray-600', '.... ... .. .')
    const bundle = bl0k.bundleData()
    if (!bundle) {
      return this.wrap(base)
    }
    const d = bundle.infobar
    if (!d || !d.gasnow) {
      return this.wrap(base)
    }
    const ethPrice = d.cg_eth.market_data.current_price.usd
    const btcPrice = d.cg_btc.market_data.current_price.usd
    const ethFee = Math.round(d.gasnow.list.find(i => i.index === 500).gasPrice / 10e6) / 100
    const btcFee = Math.round(d.mempool.halfHourFee * 100) / 100

    // https://bitcoinops.org/en/tools/calc-size/
    // 248 vbyte jako na https://mempool.space/
    const btcFeeUSD = bl0k.formatAmount(btcFee / 1e8 * btcPrice * 248)
    const ethFeeUSD = bl0k.formatAmount(ethFee / 1e9 * ethPrice * 21000)

    function item (x) {
      return m((x.noPadding ? '.pl-1' : '.pl-3.lg:pl-4') + (x.hidden ? '.hidden.md:block' : ''),
        m('a', { href: x.url, target: '_blank' }, [
          x.ico ? m(`i.fab.${x.ico}.mr-1`) : '',
          x.render ? m.trust(x.render()) : m('span.font-bold', bl0k.formatAmount(x.amount)
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
        // ico: 'fa-bitcoin',
        noPadding: true,
        url: 'https://mempool.space/',
        render: () => `/ <b>${btcFee}</b> sat/vB<span class="hidden md:inline"> (${btcFeeUSD})</span>`
        // hidden: true
      }),
      item({
        ico: 'fa-ethereum',
        url: 'https://cryptowat.ch/charts/BINANCE:ETH-USDT',
        amount: ethPrice
      }),
      item({
        // ico: 'fa-ethereum',
        noPadding: true,
        url: 'https://www.gasnow.org/',
        render: () => `/ <b>${ethFee}</b> Gwei<span class="hidden md:inline"> (${ethFeeUSD})</span>`
        // hidden: true
      })
    ], [
      bundle.online && bundle.online.connected ? m('.mr-3', m.trust(`<i class="fas fa-user mr-1"></i><b>${bundle.online.connected}</b>`)) : '',
      m('div', [
        m(`i.fas.fa-circle.${bl0k.wsConnected ? 'text-green-600' : 'text-red-600'}`, { title: bl0k.wsConnected ? 'připojený' : 'odpojený' }),
        !bl0k.wsConnected ? m('span.hidden.md:inline-block.ml-1', 'odpojen') : m('span.hidden.md:inline-block.ml-1', 'v0.4.1')
      ])
    ])
  }
}
