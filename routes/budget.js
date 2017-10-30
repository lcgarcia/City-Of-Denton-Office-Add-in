const express = require('express')
const _ = require('lodash')
const async = require('async')
const router = express.Router()
const Generator = require('../lib/BudgetSQLGenerator')
const knexQuery = require('../lib/KnexQuery')
const dataFormater = require('../lib/DataFormater')

const getDataSource = () => {
  return datasource.get('1e2f7556d1fe4538509ee5124a2edecf', { include_docs: true })
    .then(response => ({ schema: response.schema, controlSchema: response.controlSchema }));
};

var normalBusinessQuery = (generator) => {
  return knexQuery.query(generator.getBusinessUnitData(), dataFormater.formatBusinessUnit)
  .then(result => result)
  .catch(err => err);
}

router.get('/business/unit', (req, res) => {
  getDataSource()
  .then(schema => {
    const generator = new Generator({ type: req.query.type || '', schema: schema.schema, ctrlSchema: schema.controlSchema })

    if (req.query.type != 'f') {
      knexQuery.query(generator.getBusinessUnitData(), dataFormater.formatBusinessUnit)
      .then(data => res.send(data))
      .catch(err => res.send(err));
    } else {
      async.waterfall([
        (next) => {
          knexQuery.query(generator.getBusinessUnitData(), dataFormater.formatBusinessUnit)
          .then(data => next(null, data))
          .catch(err => next(err));
        }, 
        (data, next) => {
          knexQuery.query(generator.getFERCData(), dataFormater.formatFercCodes)
          .then(ferc => res.send([...data, ...ferc]))
          .catch(err => next(err));
        }
      ], (err) => res.send(err));
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
    const generator = new Generator({ type: req.query.type || '', schema: schema.schema, ctrlSchema: schema.controlSchema })
    const keys = req.body.keys, type = req.body.type, year = req.body.year
    const month = req.body.month, accounts = req.body.accounts
    const buLevel = req.body.buLevel
    const subledgers = req.body.subledgers

    let finalData = {}

    let querySets = _.map(keys, key => {
      if (type === 'f') {
        return { 
          sql: generator.createSelectStatement(false, type, year, month, accounts, { buLevel, key, subledgers: subledgers }),
          id: key
        }
      } else {
        return {
          sql: generator.createSelectStatement(false, type, year, month, accounts, { buLevel, key }),
          id: key
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
        } else {
          knexQuery.budgetSheetFDataQuery(data.sql)
          .then(result => {
            next(null, result)
          }).catch(err => {
            next(err)
          });
        }
      };
    });
    async.parallel(queries, (err, results) => {
      if (err) res.send({err: err});
      else res.send(results);
    });
  });
});

module.exports = router
