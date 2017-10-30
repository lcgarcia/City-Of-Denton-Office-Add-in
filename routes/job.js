const express = require('express')
const _ = require('lodash');
const async = require('async');
const router = express.Router()
const Generator = require('../lib/JobCostSQLGenerator')
const knexQuery = require('../lib/KnexQuery')
const dataFormater = require('../lib/DataFormater')
const Cloudant = require('cloudant');
const cloudantCredentials = JSON.parse(process.env.VCAP_SERVICES).cloudantNoSQLDB[0].credentials;
const cloudant = Cloudant({url: cloudantCredentials.url, plugin:'promises'});
const datasource = cloudant.use('datasource');

const getDataSource = () => {
  return datasource.get('1e2f7556d1fe4538509ee5124a2edecf', { include_docs: true })
    .then(response => ({ schema: response.schema, controlSchema: response.controlSchema }));
};

router.get('/ui/data', (req, res) => {
  getDataSource()
  .then(schema => {
    const generator = new Generator({ type: req.query.type || '', schema: schema.schema, ctrlSchema: schema.controlSchema })
    const sqlData = generator.getUIData();

    const queries = {};
    _.forEach(sqlData, (sql, key) => {
      queries[key] = (next) => {
        knexQuery.query(sql)
        .then(result => {
          next(null, result)
        }).catch(err => {
          next(err)
        });
      };
    });

    async.parallel(queries, (err, results) => {
      if (err) res.send({err: err});
      else res.send(results);
    });
  });
});

// layout
//    - Values are ('Cost Code/Type Details', 'No Detail')
// Department
//    - Selected Department key
// Company
//    - Selected Company key
// Project
//    - Selected project key
// Job
//    - Selected job key
// 
router.post('/sheet/data', (req, res) => {
  getDataSource()
  .then(schema => {
    const reportSelected = req.query.type || '';
    const generator = new Generator({ type: req.query.type || '', schema: schema.schema, ctrlSchema: schema.controlSchema })
    const options = {
      layout: req.body.layout,
      department: req.body.department,
      company: req.body.company,
      project: req.body.project,
      job: req.body.job
    }
    if(reportSelected == 'ka' || reportSelected == 'new') {
      options.status = req.body.status;
      options.catField = req.body.catField;
      options.catField1 = req.body.catField1;
      options.catCode = req.body.catCode;
      options.catCode1 = req.body.catCode1;
    }

    const sql = generator.createSelectStatement(req.body.month, req.body.year, options);

    //console.log(sql);

    //oracleQuery.jobSheetDataQuery(sql)
    knexQuery.jobSheetDataQuery(sql, req.body.projectList)
    .then(result => res.send(result))
    .catch(err => res.send(err));
  });
});

router.get('/departments', (req, res) => {
  getDataSource()
  .then(schema => {
    const generator = new Generator({ type: req.query.type || '', schema: schema.schema, ctrlSchema: schema.controlSchema })
    var sqlData = generator.getUIData();

    knexQuery.query(sqlData.departments)
    .then(result => res.send(result))
    .catch(err => res.send(err))
  });
});

// Department should be the key
router.get('/companies/:department', (req, res) => {
  getDataSource()
  .then(schema => {
    // The type does not matter here but you can included it if you would like
    const generator = new Generator({ type: req.query.type || '', schema: schema.schema, ctrlSchema: schema.controlSchema })

    knexQuery.query(generator.getCompanySelections(req.params.department))
    .then(result => res.send(result))
    .catch(err => res.send(err))
  });
});

// Department should be the key, Company should be the key
router.get('/project/:department/:company', (req, res) => {
  getDataSource()
  .then(schema => {
    // you must specify a report type unless it is blank
    const generator = new Generator({ type: req.query.type || '', schema: schema.schema, ctrlSchema: schema.controlSchema })

    knexQuery.query(generator.getProjectSelections(req.params.department, req.params.company))
    .then(result => res.send(result))
    .catch(err => res.send(err))
  });
});

// Department should be the key, Company should be the key, Project should be the key
router.get('/:department/:company/:project', (req, res) => {
  getDataSource()
  .then(schema => {
    const generator = new Generator({ type: req.query.type || '', schema: schema.schema, ctrlSchema: schema.controlSchema })
    const jobStatus = req.query.jobstatus || '';

    knexQuery.query(generator.getJobSelections(req.params.department, req.params.company, req.params.project, jobStatus))
    .then(result => res.send(result))
    .catch(err => res.send(err))
  });
});

router.get('/code/detail/:department/:company/:project/:status/:job/:catcode', (req, res) => {
  getDataSource()
  .then(schema => {
    const generator = new Generator({ type: req.query.type || '', schema: schema.schema, ctrlSchema: schema.controlSchema })
    const sql = generator.getCadeCodeDetail(req.params.department, req.params.company, req.params.project, req.params.status, req.params.job, req.params.catcode);

    knexQuery.query(sql)
    .then(result => res.send(result))
    .catch(err => res.send(err));
  });
});

module.exports = router
