var express = require('express');
var router = express.Router();
var Generator = require('../lib/SQLGenerator');
var generator = new Generator();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({message: 'Hello World!'});
});

router.get('/adhoc/:type/:year/:month/:accounts', (req, res) => {
	var sql = generator.createSelectStatement(true, req.params.type, req.params.year, 
		req.params.month, req.params.accounts, 
		{
			companyKey: req.params.companyKey, 
			businessUnitKey: req.params.businessUnitKey
		});
	res.send({sql: sql});
})

module.exports = router;
