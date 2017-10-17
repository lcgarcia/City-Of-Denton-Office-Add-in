var express = require('express');
var router = express.Router();
var Generator = require('../lib/SQLGenerator');
var oracleQuery = require('../lib/OracleQuery');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({message: 'Hello World!'});
});

router.get('/business/unit', (req, res) => {
  var generator = new Generator({ type: req.query.type || '' });
  
  oracleQuery(generator.getBusinessUnitData())
  .then(result => res.send(result))
  .catch(err => res.send(err)); 
});


// Test endpoint
router.get('/adhoc/:type/:year/:month/:accounts', (req, res) => {
  var generator = new Generator();
	var sql = generator.createSelectStatement(true, req.params.type, req.params.year, 
		req.params.month, req.params.accounts, 
		{
			companyKey: req.query.companyKey, 
			businessUnitKey: req.query.businessUnitKey
		});
	res.send({sql: sql});
});

module.exports = router;
