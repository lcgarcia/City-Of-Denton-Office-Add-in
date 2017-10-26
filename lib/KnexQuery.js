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

const budgetSheetFDataQuery = (sql) => {
  return knex.raw(sql)
  .then(result => {
    // Map values to array
    const values = _.map(result, val => {
      const row = _.values(val);
      let key = parseInt(row[1]);
      if (key == NaN) key = 'xxx';
      row.push(key);
      return row;
    });
    
    // Group by project key
    const groupedByKey = _.mapValues(_.groupBy(values, values[0].length-1), val => val);

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
      const alphabet = ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
      let row = ['', '', '', '', val[0][2]];
      alphabet.forEach(letter => {
        row.push(`=SUBTOTAL(9,${letter}${offSet}:${letter}${offSet+val.length-1}`);
      });
      val.push(row);
      offSet += val.length;
      return val;
    });

    // Get rows to hide
    let y = 5;
    const hiddenRows = _.map(subTotaled, (val) => {
      const range = `A${y+1}:Z${val.length+(y-1)}`;
      y += val.length;
      return { key: val[0][2], range };
    });
    //const hiddenRows = _.map(subTotaled, (val) => val.length - 1);

    // Re flatten data
    const sheetData = _.map(_.flatten(subTotaled), val => {
      return val.splice(0,val.length-1);
    });

    return { sheetData, hiddenRows, subTotalRows };
  }).catch(err => { console.log(err); return err; });
}

// Row hide only 4 outline view
const budgetSheetDataQuery = (sql) => {
  console.log(sql);
  return knex.raw(sql)
  .then(result => {
    const values = _.map(result, val => _.values(val));

    // Filter out subtotal rows if they do not have anything to subtotal
    _.forEach(values, (val, index) => {
      if (val[2] === null || val[2].trim() === '') {
        if (val[2] === null) val[2] = '';
        if (_.isUndefined(values[index+1]))
          val[2] = 'Dont Use';
        else if (val[3] >= values[index+1][3]) {
          let hasValues = false;
          for (let i = 5; i < 19; i++) {
            if (val[i] !== 0)
              hasValues = true;
          }
          if (hasValues) val[2] = 'regular';
          else val[2] = 'Dont Use';
        }
      }
      if (val[3] === undefined) val[3] = 99999;
    });

    // Filter out extra 0 rows

    // Loop through and create new array
    // If a non subtotal section == 0 don't add it
    // When you get to the same number subsection add a subtotal
    // You need a stack to find subtotals
    const headerOffset = 6;
    const subTotalStack = [];
    const sheetData = [];
    const hiddenRows = [];
    const subTotalRows = [];
    const mainHeaders = [];
    const lastTotal = 0;

    const spacingMap = {
      3: '',
      4: '  ',
      5: '    ',
      6: '      ',
      7: '        ',
      8: '          ',
      9: '            ',
      99999: ''
    };

    const addSubTotal = obj => {
      if (obj.val) {
        var newObj = _.cloneDeep(obj.val);
        var alphaMap = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        for(let i = 5; i < 19; i++) { 
          const col = alphaMap[i];
          newObj[i] = `=SUBTOTAL(9,${col}${obj.index+1+headerOffset}:${col}${sheetData.length+headerOffset-1})`;
        }
        if (newObj[3] == 4) {
          hiddenRows.push({ range: `A${obj.index+1+headerOffset}:Z${sheetData.length+headerOffset-1}`, key: newObj[4] });
          subTotalRows.push(sheetData.length+headerOffset);
        } else if (newObj[3] == 3) {
          mainHeaders.push(sheetData.length+headerOffset);
        }
        newObj[1] = '';
        newObj[3] = '';
        sheetData.push(newObj);
      }
    };

    _.forEach(values, (val, index) => {
      if (val[2].trim() !== 'Dont Use') {
        if (val[2].trim() === '' && val[2] !== 'regular') {
          // Subtotals
          // Pop most recent subtotal and write to sheetData
          if (subTotalStack.length !== 0 && subTotalStack[subTotalStack.length-1].val[3] >= val[3]) {
            const numberToPop = (subTotalStack[subTotalStack.length-1].val[3] - val[3]) + 1;
            for(let i = 0; i < numberToPop; i++) {
              addSubTotal(subTotalStack.pop());
            }
          }

          subTotalStack.push({ val, index: sheetData.length-1 });
          val[4] = spacingMap[val[3]] + val[4];
          sheetData.push(val);
        } else {
          // push to new sheet data as non subtotal
          let hasNonZero = false;
          for(let i = 5; i < 19; i++) {
            if (val[i] !== 0)
              hasNonZero = true;
          }
          if (hasNonZero) {
            val[4] = spacingMap[val[3]] + val[4];
            sheetData.push(val);
          }
        }
      }
    });

    // Pop the rest of the stack
    _.forEach(subTotalStack, val => addSubTotal(subTotalStack.pop()));

    _.forEach(sheetData, val => val[3] = '');

    // Remove first column from all rows

    return { sheetData, hiddenRows, subTotalRows, mainHeaders };

  }).catch(err => { console.log(err); return err; })
};

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

module.exports = { query, jobSheetDataQuery, budgetSheetDataQuery, budgetSheetFDataQuery };