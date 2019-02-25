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
      parent.id = parent.mcco;
      parent.childList = val.splice(1, val.length)
      return parent
    })
    return grouped
  },
  formatFercCodes: (result) => {
    return [{
      id: 'ferc',
      mcco: 'ferc',
      name: 'All FERC Codes',
      ccname: 'All FERC Codes',
      ferc: true,
      childList: _.map(result, val => {
        val.id = val.subledger;
        val.name = val.subledger;
        val.ferc = true;
        return val;
      })
    }];
  }
}