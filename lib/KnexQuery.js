const _ = require('lodash');
const oracledb = require('oracledb'); 
oracledb.maxRows = 40000;
const knex = require('knex')({
  client: 'oracledb',
  connection: {
    user: 'jdeview',
    password: 'viewonly',
    connectString: 'cap-sg-prd-1.integration.ibmcloud.com:16019/JDEPD910'
  },
  pool: { min: 4, max: 7 }
});

const query = (sql, format) => {
  return knex.raw(sql)
    .then(result => {
      result = _.map(result, o => _.mapKeys(o, (val, key) => key.toLowerCase()))
      if(format) return format(result);
      else return result;
    }).catch(err => { console.log(err); return err; })
};

const jobSheetDataQuery = (sql, format) => {
  return knex.raw(sql)
  .then(result => {
    // Map values to array
    const values = _.map(result, val => _.values(val));
    
    // Group by project key
    const groupedByKey = _.mapValues(_.groupBy(values, 3), val => val);

    // Get subTotalRows
    let offSet = 6;
    const subTotalRows = _.map(groupedByKey, val => {
      const row = offSet + val.length;
      offSet += val.length+1;
      return row;
    });

    // Recombine with subtotals
    offSet = 6;
    const subTotaled = _.map(groupedByKey, (val, key) => { 
      //const subTotal1 = _.sumBy(val,6); 
      const gCol = `=SUBTOTAL(9,G${offSet}:G${offSet+val.length-1}`;
      const hCol = `=SUBTOTAL(9,H${offSet}:H${offSet+val.length-1}`;
      const iCol = `=SUBTOTAL(9,I${offSet}:I${offSet+val.length-1}`;
      const jCol = `=SUBTOTAL(9,J${offSet}:J${offSet+val.length-1}`;
      const kCol = `=SUBTOTAL(9,K${offSet}:K${offSet+val.length-1}`;
      val.push(['', '', '', key, '', '', gCol, hCol, iCol, jCol, kCol]); 
      offSet += val.length;
      return val;
    });

    // Get rows to hide
    let y = 5;
    const hiddenRows = _.map(subTotaled, (val) => {
      const range = `A${y+1}:Z${val.length+(y-1)}`;
      const key = val[0][3];
      y += val.length;
      return { key, range };
    });
    //const hiddenRows = _.map(subTotaled, (val) => val.length - 1);

    // Re flatten data
    const sheetData = _.flatten(subTotaled);

    if(format) return format({ sheetData,  hiddenRows, subTotalRows });
    else return { sheetData,  hiddenRows, subTotalRows };
  }).catch(err => { console.log(err); return err; })
}

module.exports = { query, jobSheetDataQuery };