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
    const groupedByKey = _.mapValues(_.groupBy(values, 2), val => val);

    // Recombine with subtotals
    const subTotaled = _.map(groupedByKey, (val, key) => { 
      const subTotal1 = _.sumBy(val,6); 
      val.push(['', '', key, '', '', '', subTotal1, '', '', '', '']); 
      return val;
    });

    // Get rows to hide
    let y = 0;
    const hiddenRows = _.map(subTotaled, (val) => {
      const range = `A${y+1}:Z${val.length+(y-1)}`;
      y += val.length;
      return range;
    });
    //const hiddenRows = _.map(subTotaled, (val) => val.length - 1);

    // Re flatten data
    const sheetData = _.flatten(subTotaled);

    if(format) return format({ sheetData,  hiddenRows });
    else return { sheetData,  hiddenRows };
  }).catch(err => { console.log(err); return err; })
}

module.exports = { query, jobSheetDataQuery };