const oracle = require('oracledb');
const _ = require('lodash');

const connection = {
  user: 'jdeview',
  password: 'viewonly',
  connectString: 'cap-sg-prd-1.integration.ibmcloud.com:16019/JDEPD910'
};

const release = (connection) => {
  connection.close(err => {
    if (err) throw err;
  });
};

const runQuery = (sql) => {
  return new Promise((reject, resolve) => {
    oracle.getConnection(connection, (err, connection) => {
      if (err) reject(err);
      else {
        connection.execute(sql, [], (err, result) => {
          if (err) reject(err);
          else {
            //console.log(Object.keys(result));
            const parsedResults = _.map(result.rows, val => {
              return _.zipObject(_.map(result.metaData, val => val.name), val);
            });
            resolve(parsedResults);
          } 
          release(connection);
        });
      }
    });
  });
};

module.exports = runQuery;