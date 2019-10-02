const express = require('express')
const _ = require('lodash');
const async = require('async');
const router = express.Router()
const Generator = require('../lib/JobCostSQLGenerator')
const knexQuery = require('../lib/KnexQuery')
const dataFormater = require('../lib/DataFormater')
const Cloudant = require('cloudant');
const cloudantCredentials = JSON.parse(process.env.VCAP_SERVICES).cloudantNoSQLDB[0].credentials;
const cloudant = Cloudant({
  url: cloudantCredentials.url,
  plugin: 'promises'
});
const datasource = cloudant.use('datasource');

const getDataSource = () => {
  return datasource.get('1e2f7556d1fe4538509ee5124a2edecf', {
      include_docs: true
    })
    .then(response => ({
      schema: response.schema,
      controlSchema: response.controlSchema
    }));
};

router.get('/ui/data', (req, res) => {
  getDataSource()
    .then(schema => {
      const generator = new Generator({
        type: req.query.type || '',
        schema: schema.schema,
        ctrlSchema: schema.controlSchema
      })
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
      
      const queryDB = (cb) => {
        async.parallel(queries, (err, results) => {
          if (err) cb(err);
          else cb(null, results);
        });
      };
      
      async.retry(2, queryDB, (err, result) => {
        if (err) res.send(err);
        else res.send(result);
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
      console.log('Getting sheet data');
      var sql;
      const reportSelected = req.body.reportSelected || '';
      const generator = new Generator({
        type: reportSelected || '',
        schema: schema.schema,
        ctrlSchema: schema.controlSchema
      })
      const options = {
        reportSelected: reportSelected,
        layout: req.body.layout,
        department: req.body.department,
        company: req.body.company,
        project: req.body.project,
        job: req.body.job
      }
      if (reportSelected == 'ka' || reportSelected == 'new') {
        options.status = req.body.status;
        options.catField = req.body.catField;
        options.catField1 = req.body.catField1;
        options.catCode = req.body.catCode;
        options.catCode1 = req.body.catCode1;
        
        var isTrend = (options.layout + "").includes("Trend");
        if (reportSelected == 'ka' || isTrend) {
          var managerSql = "SELECT DISTINCT trim(MCMCU) AS MCMCU, trim(DRDL01) AS DRDL01 FROM prodctl.f0005 A, proddta.f0006 B WHERE A.DRKY = B.MCRP21 (+) and A.DRSY = '00' and A.DRRT = '21' and trim(MCMCU) Is not Null ORDER BY trim(MCMCU) ";
          if (isTrend) {
            //Determine how many periods to print
            var intFirst = 12 - req.body.monthStart + 1;
            var intMiddle = (req.body.yearEnd - req.body.yearStart - 1) * 12;
            var intLast = req.body.monthEnd;
            options.trend = {};
            options.trend.periods = intFirst + intMiddle + intLast;
            options.trend.monthStart = req.body.monthStart;
            options.trend.monthEnd = req.body.monthEnd;
            options.trend.yearStart = req.body.yearStart;
            options.trend.yearEnd = req.body.yearEnd;
            options.trend.report = reportSelected;
            
            sql = generator.createTrendSelectStatement(req.body.monthStart, req.body.yearStart, req.body.yearEnd, options);
            managerSql = "SELECT trim(mcmcu || ' ' || mcdl01) AS drdl01, trim(mcmcu) AS mcmcu FROM proddta.f0006 WHERE mcstyl = 'PJ'";
          }
          else {
            sql = generator.createSelectStatement(req.body.month, req.body.year, options);
          }
          console.log('SQL generated');
          
          const queryDB = (cb) => {
            async.waterfall([
              (next) => {
                knexQuery.query(managerSql)
                  .then(managers => next(null, managers))
                  .catch(err => next(err));
              },
              (managers, next) => {
                knexQuery.jobSheetDataQuery(sql, req.body.projectList, managers, options)
                  .then(result => cb(null, result))
                  .catch(err => next(err));
              }
            ], (err) => cb(err));
          };
          
          async.retry(2, queryDB, (err, result) => {
            if (err) res.send(err);
            else res.send(result);
          });
        }
        else {
          sql = generator.createSelectStatement(req.body.month, req.body.year, options);
          console.log('SQL generated');
          const queryDB = (cb) => {
            knexQuery.jobSheetDataQuery(sql, req.body.projectList, null, options)
              .then(result => cb(null, result))
              .catch(err => cb(err));
          };
          
          async.retry(2, queryDB, (err, result) => {
            if (err) res.send(err);
            else res.send(result);
          });
        }
      }
      else {
        const sql = generator.createSelectStatement(req.body.month, req.body.year, options);
        console.log('SQL generated');
        const queryDB = (cb) => {
          knexQuery.jobSheetDataQuery(sql, req.body.projectList, null, options)
            .then(result => cb(null, result))
            .catch(err => cb(err));
        };
        
        async.retry(2, queryDB, (err, result) => {
          if (err) res.send(err);
          else res.send(result);
        });
      }
      
    });
});

router.get('/departments', (req, res) => {
  getDataSource()
    .then(schema => {
      const generator = new Generator({
        type: req.query.type || '',
        schema: schema.schema,
        ctrlSchema: schema.controlSchema
      })
      var sqlData = generator.getUIData();
      
      const queryDB = (cb) => {
        console.log('trying');
        knexQuery.query(sqlData.departments)
          .then(result => {
            console.log('HERE');
            cb(null, result);
          })
          .catch(err => {
            knexQuery.reconnect();
            cb(err, null);
          });
        //.then(result => res.send(result))
        //.catch(err => res.send(err))
      }
      
      async.retry(2, queryDB, (err, result) => {
        if (err) res.send(err);
        else res.send(result);
      });
    });
});

// Department should be the key
router.get('/companies/:department', (req, res) => {
  getDataSource()
    .then(schema => {
      // The type does not matter here but you can included it if you would like
      const generator = new Generator({
        type: req.query.type || '',
        schema: schema.schema,
        ctrlSchema: schema.controlSchema
      })
      
      const queryDB = (cb) => {
        knexQuery.query(generator.getCompanySelections(req.params.department))
          .then(result => cb(null, result))
          .catch(err => cb(err));
      };
      
      async.retry(2, queryDB, (err, result) => {
        if (err) res.send(err);
        else res.send(result);
      });
    });
});

// Department should be the key, Company should be the key
router.get('/project/:department/:company', (req, res) => {
  getDataSource()
    .then(schema => {
      // you must specify a report type unless it is blank
      const generator = new Generator({
        type: req.query.type || '',
        schema: schema.schema,
        ctrlSchema: schema.controlSchema
      })
      
      const queryDB = (cb) => {
        var query = generator.getProjectSelections(req.params.department, req.params.company);
        knexQuery.query(query)
          .then(result => cb(null, result))
          .catch(err => cb(err));
      };
      
      async.retry(2, queryDB, (err, result) => {
        if (err) res.send(err);
        else res.send(result);
      });
    });
});

// Department should be the key, Company should be the key, Project should be the key
router.get('/:department/:company/:project', (req, res) => {
  getDataSource()
    .then(schema => {
      const generator = new Generator({
        type: req.query.type || '',
        schema: schema.schema,
        ctrlSchema: schema.controlSchema
      })
      const jobStatus = req.query.jobstatus || '';
      
      const queryDB = (cb) => {
        knexQuery.query(generator.getJobSelections(req.params.department, req.params.company, req.params.project, jobStatus))
          .then(result => cb(null, result))
          .catch(err => cb(err));
      };
      
      async.retry(2, queryDB, (err, result) => {
        if (err) res.send(err);
        else res.send(result);
      });
    });
});

router.get('/code/detail/:department/:company/:project/:status/:job/:catcode', (req, res) => {
  getDataSource()
    .then(schema => {
      const generator = new Generator({
        type: req.query.type || '',
        schema: schema.schema,
        ctrlSchema: schema.controlSchema
      })
      const sql = generator.getCadeCodeDetail(req.params.department, req.params.company, req.params.project, req.params.status, req.params.job, req.params.catcode);
      
      const queryDB = (cb) => {
        knexQuery.query(sql)
          .then(result => cb(null, result))
          .catch(err => cb(err));
      };
      
      async.retry(2, queryDB, (err, result) => {
        if (err) res.send(err);
        else res.send(result);
      });
    });
});

module.exports = router