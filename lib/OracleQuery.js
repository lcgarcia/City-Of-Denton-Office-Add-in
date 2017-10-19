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

module.exports = {
  batchQuery: (sql, id, format) => {
    return new Promise((resolve, reject) => {
      oracle.getConnection(connection, (err, connection) => {
        if (err) reject({err: err, id});
        else {
          connection.execute(sql, [], { maxRows: 10000 }, (err, result) => {
            if (err) reject({err: err, id});
            else {
              //console.log(Object.keys(result));
              const parsedResults = _.map(result.rows, val => {
                return _.zipObject(_.map(result.metaData, val => val.name.toLowerCase()), val);
              });
              if(format)
                resolve(format(parsedResults, id));
              else resolve({results: parsedResults, id});
            } 
            release(connection);
          });
        }
      });
    });
  },
  query: (sql, format) => {
    return new Promise((resolve, reject) => {
      oracle.getConnection(connection, (err, connection) => {
        if (err) reject(err);
        else {
          connection.execute(sql, [], { maxRows: 10000 }, (err, result) => {
            if (err) reject(err);
            else {
              //console.log(Object.keys(result));
              const parsedResults = _.map(result.rows, val => {
                return _.zipObject(_.map(result.metaData, val => val.name.toLowerCase()), val);
              });
              if(format)
                resolve(format(parsedResults));
              else resolve(parsedResults);
            } 
            release(connection);
          });
        }
      });
    });
  }
}
