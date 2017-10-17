var express = require('express')
var router = express.Router()
var Generator = require('../lib/SQLGenerator')
var oracleQuery = require('../lib/OracleQuery')
var dataFormater = require('../lib/DataFormater')

router.get('/business/unit', (req, res) => {
  var generator = new Generator({ type: req.query.type || '' })

  oracleQuery(generator.getBusinessUnitData(), dataFormater.formatBusinessUnit)
  .then(result => res.send(result))
  .catch(err => res.send(err))
})

router.get('/sheet/data/:type/:year/:month/:accounts/:key/:buLevel', (req, res) => {
  let options = {
    buLevel: req.query.buLevel,
    key: req.params.key
  }
  if ('subledgers' in req.query)
    options.subledgers = req.query.subledgers

  const generator = new Generator({ type: req.params.type })
  const sql = generator.createSelectStatement(false, req.params.type, req.params.year, req.params.month, req.params.accounts, options)

  oracleQuery(sql)
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
