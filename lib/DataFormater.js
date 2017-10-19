const _ = require('lodash');

module.exports = {
  formatBusinessUnit: (result) => {
    const renamed = _.map(result, val => {
      val.id = val.mcmcu
      val.name = val.mcdl01
      delete val.mcmcu
      delete val.mcdl01
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