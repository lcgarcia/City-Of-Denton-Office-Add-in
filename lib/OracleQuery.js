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

const query = (sql, format) => {
  return new Promise((resolve, reject) => {
    oracle.getConnection(connection, (err, connection) => {
      if (err) { console.log("Connection: " + err); reject(err); }
      else {
        connection.execute(sql, [], { maxRows: 50000 }, (connectionErr, result) => {
          if (connectionErr) { console.log("Execute: " + connectionErr); reject(connectionErr); }
          else {
            //console.log(Object.keys(result));
            const parsedResults = _.map(result.rows, val => {
              return _.zipObject(_.map(result.metaData, val => val.name.toLowerCase()), val);
            });
            if(format){
              resolve(format(parsedResults));
              release(connection);
            } else {
              resolve(parsedResults);
              release(connection);
            }
          } 
        });
      }
    });
  });
};

const jobSheetDataQuery = (sql, format) => {
  return new Promise((resolve, reject) => {
    oracle.getConnection(connection, (err, connection) => {
      if (err) reject(err);
      else {
        connection.execute(sql, [], { maxRows: 50000 }, (connectionErr, result) => {
          if (connectionErr) reject(connectionErr);
          else {
            const parsedResults = result.rows;
            if(format){
              resolve(format(parsedResults));
              release(connection);
            } else {
              resolve(parsedResults);
              release(connection);
            }
          } 
        });
      }
    });
  });
};

module.exports = {
  query,
  jobSheetDataQuery
}
