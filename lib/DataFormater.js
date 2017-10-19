const _ = require('lodash');

module.exports = {
  formatBusinessUnit: (result) => {
    const renamed = _.map(result, val => {
      val.id = val.MCMCU
      val.name = val.MCDL01
      delete val.MCMCU
      delete val.MCDL01
      return val
    })

    const grouped = _.map(_.groupBy(renamed, 'mcco'), (val) => {
      const parent = val[0]
      parent.childList = val.splice(1, val.length)
      return parent
    })
    return grouped
  }
}