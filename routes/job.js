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
});

router.get('/departments', (req, res) => {
  var generator = new Generator({ type: req.query.type || '' })
  var sqlData = generator.getUIData();

  oracleQuery.query(sqlData.departments)
  .then(result => res.send(result))
  .catch(err => res.send(err))
});

// Department should be the key
router.get('/companies/:department', (req, res) => {
  // The type does not matter here but you can included it if you would like
  var generator = new Generator({ type: req.query.type || '' });

  oracleQuery.query(generator.getCompanySelections(req.params.department))
  .then(result => res.send(result))
  .catch(err => res.send(err))
});

// Department should be the key, Company should be the key
router.get('/project/:department/:company', (req, res) => {
  // you must specify a report type unless it is blank
  var generator = new Generator({ type: req.query.type || '' });

  oracleQuery.query(generator.getProjectSelections(req.params.department, req.params.company))
  .then(result => res.send(result))
  .catch(err => res.send(err))
});

// Department should be the key, Company should be the key, Project should be the key
router.get('/:department/:company/:project', (req, res) => {
  var generator = new Generator({ type: req.query.type || '' });
  const jobStatus = req.query.jobstatus || '';

  oracleQuery.query(generator.getJobSelections(req.params.department, req.params.company, req.params.project, jobStatus))
  .then(result => res.send(result))
  .catch(err => res.send(err))
});

router.get('/code/detail/:department/:company/:project/:status/:job/:catcode', (req, res) => {
  const generator = new Generator({ type: req.query.type || '' });
  const sql = generator.getCadeCodeDetail(req.params.department, req.params.company, req.params.project, req.params.status, req.params.job, req.params.catcode);

  oracleQuery.query(sql)
  .then(result => res.send(result))
  .catch(err => res.send(err));
});

module.exports = router
