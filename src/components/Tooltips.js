const { $bl0k, m } = require('../lib/bl0k')

const { select: d3select } = require('d3-selection')
const { scaleLinear: d3scaleLinear } = require('d3-scale')
const { line: d3line } = require('d3-shape')

const Tooltip = {
  view (vnode) {
    const tt = vnode.attrs.data
    const style = `z-index: 1; top: ${tt.top || 0}px; left: ${tt.left || 0}px; width: 400px;`
    return m('#bl0k-tooltip.absolute.border.py-1.px-2.bg-white.shadow.shadow-lg.rounded.transition-all.duration-300.ease-in-out', {
      style,
      onclick: () => {
        $bl0k.symbolTooltipHide()
      }
    }, tt.content)
  }
}

const Sparkline = {
  oncreate (vnode) {
    const src = vnode.attrs.data
    const DATA_COUNT = src.length
    const WIDTH = 100
    const HEIGHT = 37

    this.svg = d3select(vnode.dom).append('svg')
      .attr('width', WIDTH)
      .attr('height', HEIGHT)

    const min = Math.min(...src)
    const max = Math.max(...src)
    const positive = Boolean((src[src.length - 1] - src[0]) > 0)
    // console.log(JSON.stringify(src), src.length, src[src.length], src[0], src[src.length] - src[0])

    const x = d3scaleLinear().domain([0, DATA_COUNT]).range([0, WIDTH])
    const y = d3scaleLinear().domain([min, max]).range([HEIGHT, 0])
    const line = d3line().x((d, i) => x(i)).y(d => y(d))

    this.svg.append('path').datum(src)
      .attr('fill', 'none')
      .attr('stroke', positive ? '#2f855a' : '#c53030')
      .attr('stroke-width', 1)
      .attr('d', line)
  },
  view () {
    return m('.border.border-gray-200')
  }
}

const TokenTooltip = {
  view (vnode) {
    const d = vnode.attrs.data
    if (!d) {
      return m('div', 'Token nenalezen')
    }
    return m('.w-auto', [
      m('.flex', [
        m('.mt-1.h-full', [
          m('.block.w-10', [
            m('img.h-10', { src: d.image.large })
          ])
        ]),
        m('.w-full', [
          m('.flex.items-center', [
            m('.ml-2.text-lg.font-bold', d.name),
            m('.ml-2', '(' + d.symbol.toUpperCase() + ')')
          ]),
          m('div', [
            m('.mt-1.ml-2.flex.items-center.w-full', [
              m('.block.w-1/3.pr-1', [
                m('.font-bold', $bl0k.utils.formatAmount(d.market_data.current_price.usd)),
                m('.text-sm.text-gray-700', '(' + $bl0k.utils.formatAmount(d.market_data.current_price.czk, 2, 'czk') + ')')
              ]),
              m('.block.w-1/3.flex.justify-center.text-center', [
                m('.block', [
                  m('.inline-block', { class: `text-sm text-${d.market_data.price_change_percentage_24h > 0 ? 'green' : 'red'}-700` }, [(d.market_data.price_change_percentage_24h > 0 ? '+' : '') + (Math.round(((d.market_data.price_change_percentage_24h) * 100)) / 100) + '% ', m('span.text-xs', '(24h)')]),
                  m('.inline-block', { class: `text-sm text-${d.market_data.price_change_percentage_7d > 0 ? 'green' : 'red'}-700` }, [(d.market_data.price_change_percentage_7d > 0 ? '+' : '') + (Math.round(((d.market_data.price_change_percentage_7d) * 100)) / 100) + '% ', m('span.text-xs', '(7d)')])
                ])
              ]),
              m('.block.w-1/3', [
                m('div', [
                  m('.flex.justify-end.mr-3', m(Sparkline, { data: d.market_data.sparkline_7d.price }))
                ])
              ])
            ])
          ])
        ]),
        m('div', [
          m('div', [
          ]),
          m('div', [
          ])
        ])
      ]),
      // m('.mt-2.text-sm', d.description.en)
      m('.mx-1.my-2.text-sm', [
        // m('div', `Zásoba v oběhu: ${d.market_data.circulating_supply}`),
        m('div', `Tržní kapitalizace: ${$bl0k.utils.formatAmount(d.market_data.market_cap.usd, 0)}`),
        d.market_data.fully_diluted_valuation.usd ? m('div', `FDV: ${$bl0k.utils.formatAmount(d.market_data.fully_diluted_valuation.usd)}`) : ''
      ])
    ])
  }
}

module.exports = {
  Tooltip,
  Sparkline,
  TokenTooltip
}
