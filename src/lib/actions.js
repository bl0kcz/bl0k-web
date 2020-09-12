/* globals localStorage, web3, ethereum, alert, confirm */

module.exports = ({ $bl0k, m }) => ({

  likeArticle (item) {
    $bl0k.uniRequest('articleLike', { params: { id: item.id } })
    return false
  },

  deleteArticle (item) {
    if (!confirm(`Opravdu smazat zprávu "${item.sid}"?`)) {
      return false
    }
    $bl0k.request({
      method: 'DELETE',
      url: `/article/${item.id}`
    }).then(() => {
      // loadData(true)
    })
    return false
  },

  changeArticleType (item, type) {
    if (!confirm(`Opravdu změnit stav zprávy "${item.id}" na "${type}"?`)) {
      return false
    }
    $bl0k.request({
      method: 'POST',
      url: `/article/${item.id}/type`,
      body: {
        type
      }
    }).then(() => {
      // loadData(true)
    })
  },

  ethLogin () {
    if (!window.ethereum) {
      alert('Nemáte nainstalovanou MetaMask!')
      return false
    }
    ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
      const addr = accounts[0]
      const msg = `Přihlášení na bl0k.cz [${Number(new Date())}]`
      const cmd = { method: 'personal_sign', params: [msg, addr], from: addr }
      web3.currentProvider.sendAsync(cmd, (err, res) => {
        if (err) {
          console.log('Chyba při podpisu')
          console.error(err)
          return false
        }
        $bl0k.request({
          url: '/eth-login',
          method: 'POST',
          body: { addr, msg, sign: res.result }

        }).then((out) => {
          if (out.error) {
            alert(out.error)
            return false
          }

          localStorage.setItem('auth', JSON.stringify(out))
          $bl0k.initAuth().then(() => {
            m.redraw()

            const rt = m.route.get()
            // console.log(rt)
            if (rt.match(/^\/chain/) || rt === '/') {
              $bl0k.fetchData('bundle', {}, { reload: true })
              // loadData(true)
            }
          })
        })
      })
    })
    return false
  },

  logout () {
    localStorage.removeItem('auth')
    document.location = '/'
    return false
  }

})
