var express = require('express')
const _ = require('lodash');
var router = express.Router()
var Generator = require('../lib/JobCostSQLGenerator')
var oracleQuery = require('../lib/OracleQuery')
var dataFormater = require('../lib/DataFormater')

router.get('/ui/data', (req, res) => {
  var generator = new Generator({ type: req.query.type || '' })
  var sqlData = generator.getUIData();

  var finalData = {};

  _.forEach(sqlData, (sql, key) => {
    oracleQuery.batchQuery(sql, key)
    .then(result => {
      
      finalData[result.id] = result.results;
      if(Object.keys(finalData).length == Object.keys(sqlData).length)
        res.send(finalData);
    }).catch(err => {
      finalData[result.id] = result.err;
      if(Object.keys(finalData).length == Object.keys(sqlData).length)
        res.send(finalData);
    });
  });
})

module.exports = router
