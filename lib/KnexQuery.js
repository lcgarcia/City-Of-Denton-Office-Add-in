const _ = require('lodash');
const oracledb = require('oracledb'); 
oracledb.maxRows = 40000;
const knex = require('knex')({
  client: 'oracledb',
  connection: {
    user: 'jdeview',
    password: 'viewonly',
    connectString: 'cap-sg-prd-4.integration.ibmcloud.com:18525/JDEPD910'
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

/*
const budgetSheetDataQuery = (sql) => {
  return knex.raw(sql)
  .then(result => {
    const values = _.map(result, val => _.values(val));

    // Loop through and create new array
    // If a non subtotal section == 0 don't add it
    // When you get to the same number subsection add a subtotal
    // You need a stack to find subtotals
    const subTotalStack = [];
    const newSheetData = [];
    const hiddenRows = [];
    const lastTotal = 0;
    _.forEach(values, (val) => {
      if(subTotalStack.length === 0) {
        if (val[2].trim() === '' && _.sumBy()) {
          // Subtotals
          // Pop most recent subtotal and write to newSheetData
          const subTotalValue = subTotalStack.pop();
          if (subTotalValue) {
            for(let i = 5; i < 19; i++) subTotalValue[i] = 'SubTotal';
            newSheetData.push(subTotalValue);
          }
          subTotalStack.push(val);
        } else if (val[5] !== 0) {
          // push to new sheet data as non subtotal
          
        }
      }
    });


  }).catch(err => { console.log(err); return err; })
};
*/

const jobSheetDataQuery = (sql, projects, format) => {
  return knex.raw(sql)
  .then(result => {
    // Map values to array
    const values = _.map(result, val => _.values(val));
    
    // Group by project key
    const groupedByKey = _.mapValues(_.groupBy(values, 2), val => val);

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
      var projectListKey = val[0][2].trim();
      var project = _.find(projects, { key: projectListKey });
      if (project)
        val.push(['', '', '', project.name, '', '', gCol, hCol, iCol, jCol, kCol]); 
      else 
        val.push(['', '', '', projectListKey, '', '', gCol, hCol, iCol, jCol, kCol]); 
      offSet += val.length;
      return val;
    });

    // Get rows to hide
    let y = 5;
    const hiddenRows = _.map(subTotaled, (val) => {
      const range = `A${y+1}:Z${val.length+(y-1)}`;
      var projectListKey = val[0][2].trim();
      var project = _.find(projects, { key: projectListKey });
      y += val.length;
      if (project)
        return { key: project.name , range };
      else 
        return { key: projectListKey , range };
    });
    //const hiddenRows = _.map(subTotaled, (val) => val.length - 1);

    // Re flatten data
    const sheetData = _.flatten(subTotaled);

    if(format) return format({ sheetData,  hiddenRows, subTotalRows });
    else return { sheetData,  hiddenRows, subTotalRows };
  }).catch(err => { console.log(err); return err; })
}

module.exports = { query, jobSheetDataQuery };