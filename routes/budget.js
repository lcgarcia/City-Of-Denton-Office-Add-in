const express = require('express')
const _ = require('lodash')
const router = express.Router()
const Generator = require('../lib/BudgetSQLGenerator')
const oracleQuery = require('../lib/OracleQuery')
const dataFormater = require('../lib/DataFormater')

router.get('/business/unit', (req, res) => {
  var generator = new Generator({ type: req.query.type || '' })

  oracleQuery.query(generator.getBusinessUnitData(), dataFormater.formatBusinessUnit)
  .then(result => res.send(result))
  .catch(err => res.send(err))
})

// accounts values
//      Balance - ("Between '0' and '3999'")
//      Income - ("Between '4000' and '9999'")
// Key 
//      is the account key in the dropdown this needs to be passed as an array and run for all keys selected ("00100", "00101", etc)
// buLevel 
//      ("Comp")
router.post('/sheet/data', (req, res) => {
  var generator = new Generator({ type: req.body.type });
  const keys = req.body.keys, type = req.body.type, year = req.body.year
  const month = req.body.month, accounts = req.body.accounts
  const buLevel = req.body.buLevel
  const subledgers = req.body.subledgers

  let finalData = {}

  let querySets = _.map(keys, key => {
    if (type === 'f') {
      return { 
        sql: generator.createSelectStatement(false, type, year, month, accounts, { buLevel, key, subledgers: generator.getSubledger() }),
        id: key
      }
    } else {
      return {
        sql: generator.createSelectStatement(false, type, year, month, accounts, { buLevel, key }),
        id: key
      }
    }
  })
  
  _.forEach(querySets, data => {
    oracleQuery.batchQuery(data.sql, data.id)
    .then(result => {
      finalData[result.id] = result.results
      if(Object.keys(finalData).length == Object.keys(querySets).length)
        res.send(finalData)
    }).catch(err => {
      finalData[err.id] = err.err
      if(Object.keys(finalData).length == Object.keys(querySets).length)
        res.send(finalData)
    })
  })
})

router.get('/query/:sql', (req, res) => {
  oracleQuery.query(req.params.sql)
  .then(result => res.send(result))
  .catch(err => res.send(err))
});

router.get('/sheet/data/:type/:year/:month/:accounts/:key/:buLevel', (req, res) => {
  let options = {
    buLevel: req.query.buLevel,
    key: req.params.key
  }
  if ('subledgers' in req.query)
    options.subledgers = req.query.subledgers

  const generator = new Generator({ type: req.params.type })
  const sql = generator.createSelectStatement(false, req.params.type, req.params.year, req.params.month, req.params.accounts, options)

  oracleQuery.query(sql)
  .then(result => res.send(result))
  .catch(err => res.send(err))
})


// Test endpoint
router.get('/adhoc/:type/:year/:month/:accounts', (req, res) => {
  var generator = new Generator()
	var sql = generator.createSelectStatement(true, req.params.type, req.params.year,
		req.params.month, req.params.accounts, 
		{
			companyKey: req.query.companyKey, 
			businessUnitKey: req.query.businessUnitKey
		})
	res.send({sql: sql})
})

module.exports = router
