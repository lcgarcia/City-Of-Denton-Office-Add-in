const oracle = require('oracledb');
const _ = require('lodash');
const express = require('express');

const connection = {
  user: 'jdeview',
  password: 'viewonly',
  connectString: 'cap-sg-prd-1.integration.ibmcloud.com:16019/JDEPD910'
};
const router = express.Router();
const release = (connection) => {
  connection.close(err => {
    if (err) throw err;
  });
};


/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/test', (req, res) => {
  oracle.getConnection(connection, (err, connection) => {
    if(err) res.send(err);
    else {
      connection.execute('SELECT * FROM proddta.F0902', [], (err, result) => {
        if(err) res.send(err);
        else {
          //console.log(Object.keys(result));
          const parsedResults = _.map(result.rows, val => {
            return _.zipObject(_.map(result.metaData, val => val.name), val);
          });
          res.send(parsedResults);
        } 
        release(connection);
      });
    }
  });
});

module.exports = router;
