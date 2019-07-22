const express = require('express')
const _ = require('lodash')
const async = require('async')
const router = express.Router()
const Generator = require('../lib/BudgetSQLGenerator')
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

router.get('/business/unit', (req, res) => {
  getDataSource()
    .then(schema => {
      const generator = new Generator({
        type: req.query.type || '',
        schema: schema.schema,
        ctrlSchema: schema.controlSchema
      })
      
      if (req.query.type != 'f') {
        const queryDB = (cb) => {
          knexQuery.query(generator.getBusinessUnitData(), dataFormater.formatBusinessUnit)
            .then(data => cb(null, data))
            .catch(err => cb(err));
        };
        
        async.retry(2, queryDB, (err, result) => {
          if (err) res.send(err);
          else res.send(result);
        });
      }
      else {
        const queryDB = (cb) => {
          async.waterfall([
            (next) => {
              knexQuery.query(generator.getBusinessUnitData('f'), dataFormater.formatBusinessUnit)
                .then(data => next(null, data))
                .catch(err => next(err));
            },
            (data, next) => {
              knexQuery.query(generator.getFERCData(), dataFormater.formatFercCodes)
                .then(ferc => cb(null, [...data, ...ferc]))
                .catch(err => next(err));
            }
          ], (err) => cb(err));
        };
        
        async.retry(2, queryDB, (err, result) => {
          if (err) res.send(err);
          else res.send(result);
        });
      }
    });
});

// accounts values
//      Balance - ("Between '0' and '3999'")
//      Income - ("Between '4000' and '9999'")
// Key 
//      is the account key in the dropdown this needs to be passed as an array and run for all keys selected ("00100", "00101", etc)
// buLevel 
//      ("Comp")
router.post('/sheet/data', (req, res) => {
  getDataSource()
    .then(schema => {
      const generator = new Generator({
        type: req.query.type || '',
        schema: schema.schema,
        ctrlSchema: schema.controlSchema
      })
      const keys = req.body.keys,
        type = req.body.type,
        year = req.body.year
      const month = req.body.month,
        accounts = req.body.accounts
      const buLevel = req.body.buLevel
      const subledgers = req.body.subledgers
      
      let finalData = {}
      
      let querySets = _.map(keys, key => {
        if (type === 'f') {
          return {
            sql: generator.createSelectStatement(key.adHoc, type, year, month, accounts, {
              buLevel: key.buLevel,
              key: key.id,
              companyKey: key.companyKey,
              businessUnitKey: key.businessUnitKey,
              subledgers: subledgers
            }),
            id: key.id
          }
        }
        else {
          return {
            sql: generator.createSelectStatement(key.adHoc, type, year, month, accounts, {
              buLevel: key.buLevel,
              key: key.id,
              companyKey: key.companyKey,
              businessUnitKey: key.businessUnitKey
            }),
            id: key.id
          }
        }
      });
      
      const queries = {};
      _.forEach(querySets, data => {
        queries[data.id] = (next) => {
          if (req.body.type != 'f') {
            knexQuery.budgetSheetDataQuery(data.sql)
              .then(result => {
                next(null, result)
              }).catch(err => {
                next(err)
              });
          }
          else {
            knexQuery.budgetSheetFDataQuery(data.sql)
              .then(result => {
                next(null, result)
              }).catch(err => {
                next(err)
              });
          }
        };
      });
      
      const queryDB = (cb) => {
        async.parallel(queries, (err, results) => {
          if (err) cb({
            err: err
          });
          else cb(null, results);
        });
      };
      
      async.retry(2, queryDB, (err, result) => {
        if (err) res.send(err);
        else res.send(result);
      });
    });
});

module.exports = router