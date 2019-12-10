const _ = require('lodash');
const SheetFormater = require('./SheetFormatter');
const oracledb = require('oracledb');
oracledb.maxRows = 200000;
const oracleConnection = {
  client: "oracledb",
  connection: {
    user: "jdeview",
    password: "viewonly",
    connectString: "cap-sg-prd-1.integration.ibmcloud.com:18056/jdeprod"
  },
  pool: {
    min: 4,
    max: 7
  }
};

let knex = require("knex")(oracleConnection);

const reconnect = () => {
  knex = require("knex")(oracleConnection);
};

const query = (sql, format) => {
  return knex.raw(sql).then(result => {
    result = _.map(result, o => _.mapKeys(o, (val, key) => key.toLowerCase()));
    if (format) return format(result);
    else return result;
  });
};

const alphaMap = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const getHiddenJson = hiddenRows => {
  var hiddenRowsData = {};
  var jsonHiddenData;
  var alphaKey1 = 1;
  var alphaKey2 = 1;
  hiddenRowsData.json = [];
  if (hiddenRows.length > 200) {
    var sliceStart = 0;
    var sliceEnd = 200;
    
    while (sliceEnd < hiddenRows.length) {
      jsonHiddenData = JSON.stringify(hiddenRows.slice(sliceStart, sliceEnd));
      hiddenRowsData.json.push(jsonHiddenData);
      sliceStart = sliceEnd;
      sliceEnd += 200;
      alphaKey2++;
      if (alphaKey2 == alphaMap.length) {
        alphaKey1++;
        alphaKey2 = 1;
      }
    }
    jsonHiddenData = JSON.stringify(
      hiddenRows.slice(sliceStart, hiddenRows.length)
    );
    hiddenRowsData.json.push(jsonHiddenData);
  }
  else hiddenRowsData.json.push(JSON.stringify(hiddenRows));
  hiddenRowsData.header = `${alphaMap[1]}${alphaMap[1]}1:${
    alphaMap[alphaKey1]
  }${alphaMap[alphaKey2]}1`;
  return hiddenRowsData;
};

const budgetSheetFDataQuery = (sql, sheetName) => {
  return knex.raw(sql).then(result => {
    var incomeValues = [];
    // Map values to array
    const values = _.map(result, val => {
      const row = _.values(val);
      let key = (row[1] + "").trim();
      if (!key) key = "xxx";
      row.push(key);
      row[1] = row[3];
      return row;
    });
    _.forEach(values, val => {
      for (let i = 5; i < val.length - 1; i++) {
        if (val[i] != 0) {
          incomeValues.push(val);
          break;
        }
      }
    });
    let projectIndex = 2;
    if (incomeValues.length > 0) projectIndex = incomeValues[0].length - 1;
    
    // Group by project key
    const groupedByKey = SheetFormater.groupByProjectKey(
      incomeValues,
      projectIndex
    );
    
    // Get subTotalRows
    let offSet = 7;
    const subTotalRows = SheetFormater.mapSubTotalRows(groupedByKey, offSet);
    
    // Recombine with subtotals
    const columnNames = ["F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];
    const subTotaled = SheetFormater.addFSubTotalRows(
      groupedByKey,
      columnNames,
      offSet
    );
    
    // Get rows to hide
    let headerOffset = 6;
    const hiddenRows = SheetFormater.mapFHiddenRows(subTotaled, headerOffset);
    
    var allSubTotalRows = [];
    _.forEach(hiddenRows, val => {
      allSubTotalRows.push(val.subTotalRow);
    });
    
    // Re flatten data
    var sheetData = _.map(_.flatten(subTotaled), val => {
      return val.splice(0, val.length - 1);
    });
    
    var hiddenRowsData = getHiddenJson(hiddenRows);
    
    return {
      sheetData,
      sheetName,
      hiddenRows,
      hiddenRowsData,
      subTotalRows,
      allSubTotalRows
    };
  });
};

// Row hide only 4 outline view
const budgetSheetDataQuery = (sql, sheetName) => {
  return knex.raw(sql).then(result => {
    const values = SheetFormater.mapResultsToArray(result, false);
    
    // Filter out subtotal rows if they do not have anything to subtotal
    _.forEach(values, (val, index) => {
      if (val[2] === null || val[2].trim() === "") {
        if (val[2] === null) val[2] = "";
        if (_.isUndefined(values[index + 1])) val[2] = "Dont Use";
        else if (val[3] >= values[index + 1][3]) {
          let hasValues = false;
          for (let i = 5; i < 19; i++) {
            if (val[i] !== 0) hasValues = true;
          }
          if (hasValues) val[2] = "regular";
          else val[2] = "Dont Use";
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
    const allSubTotalRows = [];
    
    const spacingMap = {
      3: "",
      4: "  ",
      5: "    ",
      6: "      ",
      7: "        ",
      8: "          ",
      9: "            ",
      99999: ""
    };
    
    const addSubTotal = obj => {
      if (obj.val) {
        var newObj = _.cloneDeep(obj.val);
        var alphaMap = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        for (let i = 5; i < 19; i++) {
          const col = alphaMap[i];
          newObj[i] = `=SUBTOTAL(9,${col}${obj.index +
            1 +
            headerOffset}:${col}${sheetData.length + headerOffset - 1})`;
        }
        if (newObj[3] == 4) {
          hiddenRows.push({
            range: `A${obj.index + 1 + headerOffset}:Z${sheetData.length +
              headerOffset -
              1}`,
            key: newObj[4],
            rows: `[${sheetData.length + headerOffset}]`
          });
          subTotalRows.push(sheetData.length + headerOffset);
        }
        else if (newObj[3] == 3) {
          mainHeaders.push(sheetData.length + headerOffset);
        }
        newObj[1] = "";
        newObj[3] = "";
        allSubTotalRows.push(sheetData.length + headerOffset - 1);
        sheetData.push(newObj);
      }
    };
    
    _.forEach(values, (val) => {
      if (val[2].trim() !== "Dont Use") {
        if (val[2].trim() === "" && val[2] !== "regular") {
          // Subtotals
          // Pop most recent subtotal and write to sheetData
          if (
            subTotalStack.length !== 0 &&
            subTotalStack[subTotalStack.length - 1].val[3] >= val[3]
          ) {
            const numberToPop =
              subTotalStack[subTotalStack.length - 1].val[3] - val[3] + 1;
            for (let i = 0; i < numberToPop; i++) {
              if (subTotalStack.length !== 0) addSubTotal(subTotalStack.pop());
            }
          }
          
          subTotalStack.push({
            val,
            index: sheetData.length - 1
          });
          val[4] = spacingMap[val[3]] + val[4];
          sheetData.push(val);
        }
        else {
          if(val[2] == "regular") val[2] = "";
          // push to new sheet data as non subtotal
          let hasNonZero = false;
          for (let i = 5; i < 19; i++) {
            if (val[i] !== 0) hasNonZero = true;
          }
          if (hasNonZero) {
            if (
              subTotalStack.length !== 0 &&
              subTotalStack[subTotalStack.length - 1].val[3] >= val[3]
            ) {
              addSubTotal(subTotalStack.pop());
            }
            val[4] = spacingMap[val[3]] + val[4];
            sheetData.push(val);
          }
        }
      }
    });
    
    // Pop the rest of the stack
    _.forEach(subTotalStack, val => addSubTotal(subTotalStack.pop()));
    
    _.forEach(sheetData, val => (val[3] = ""));
    
    var hiddenRowsData = getHiddenJson(hiddenRows);
    
    return {
      sheetData,
      sheetName,
      hiddenRows,
      hiddenRowsData,
      subTotalRows,
      mainHeaders,
      allSubTotalRows
    };
  });
};

const jobSheetDataQuery = (sql, projects, managers, options) => {
  return knex.raw(sql).catch(function(error) {
    console.error(error);
  }).then(result => {
    const layout = options.layout;
    const removeSubtotals = options.removeSubtotals;
    const offSet = 6;
    let rowPadding = ["", "", "-"];
    let columnNames = ["G", "H", "I", "J", "K"];
    let projectIndex = 2;
    let subTotaled;
    let objectColumn = 4;
    var incomeValues = [];
    var hiddenRows = [];
    var trend = null;
    var alphaKey1;
    var alphaKey2;
    var subTotalRows = [];
    var hiddenRowsData = "";
    
    // Map values to array
    let values = SheetFormater.mapResultsToArray(result, layout == "FERC/Cost Code Subtotals" || layout == "Cost Type Subtotals");
    _.forEach(values, val => {
      let start = 6;
      let end = val.length - 1;
      for (let i = start; i < end; i++) {
        if (val[i] != 0 && val[i] != "0") {
          incomeValues.push(val);
          break;
        }
      }
    });
    
    if (layout == "No Details") columnNames = ["E", "F", "G", "H", "I"];
    if (managers) {
      rowPadding = ["", ""];
      objectColumn = 5;
      
      columnNames = ["H", "I", "J", "K", "L"];
      if (layout == "No Details") columnNames = ["F", "G", "H", "I", "J"];
      if (options.trend)
        incomeValues = SheetFormater.mapTrendResultsToArray(
          incomeValues,
          managers
        );
      else
        incomeValues = SheetFormater.mapManagerResultsToArray(
          incomeValues,
          managers
        );
      if (incomeValues && incomeValues.length > 0)
        projectIndex = incomeValues[0].length - 1;
    }
    
    // Group by project key
    var groupedByKey = SheetFormater.groupByProjectKey(
      incomeValues,
      projectIndex
    );
    
    
    if(!removeSubtotals){
      // Get subTotalRows
      subTotalRows = SheetFormater.mapSubTotalRows(
        groupedByKey,
        offSet + 1,
        layout
      );
    }
    

    if (managers) {
      if (options.trend) {
        // Remove project key
        _.forEach(groupedByKey, group => {
          _.forEach(group, val => {
            val.pop();
          });
        });

        var header =
          options.trend.report == "ka" ?
          [
            "Dept",
            "Company",
            "Project Manager",
            "Project",
            "Bus Unit",
            "Object"
          ] :
          [
            "Dept",
            "Company",
            "Project",
            "Bus Unit",
            "Object",
            "Subsidiary"
          ];
        var grandTotal = [];
        options.trend.lastColumn = "F";
        if (subTotalRows.length > 0) {
          subTotaled = SheetFormater.addTrendSubTotalRows(
            groupedByKey,
            offSet,
            rowPadding,
            options.trend.periods
          );
          const columnLength = subTotaled[0][0].length;
          
          if (columnLength > 26) {
            var leftLetter = Math.floor(columnLength / 26);
            var rightLetter = columnLength % 26;
            if (leftLetter < 0) leftLetter = 26;
            if (rightLetter < 0) rightLetter = 26;
            options.trend.lastColumn =
              alphaMap[leftLetter] + "" + alphaMap[rightLetter];
          }
          else options.trend.lastColumn = alphaMap[columnLength];
          
          const monthValues = [
            "October",
            "November",
            "December",
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September"
          ];
          var month = options.trend.monthStart;
          var fiscYear = (options.trend.yearStart + "").substr(-2);
          var lastRow = subTotalRows[subTotalRows.length - 1];
          alphaKey1 = 0;
          alphaKey2 = 7;
          
          //build the string of JDE columns to be selected
          for (let i = 1; i <= options.trend.periods; i++) {
            //make sure fiscal year is always 2 digit
            if (fiscYear == 100) fiscYear = 0;
            header.push(monthValues[month] + "-FY" + fiscYear);
            grandTotal.push(
              `=SUBTOTAL(9,${alphaMap[alphaKey1]}${
                alphaMap[alphaKey2]
              }${offSet + 1}:${alphaMap[alphaKey1]}${
                alphaMap[alphaKey2]
              }${lastRow})`
            );
            
            //check if we are crossing into another fiscal year
            if (month < 11) month++;
            else {
              month = 0;
              fiscYear++;
            }
            
            alphaKey2++;
            if (alphaKey2 == alphaMap.length) {
              alphaKey1++;
              alphaKey2 = 1;
            }
          }
        }
        options.trend.header = [header];
        options.trend.grandTotal = [grandTotal];
      }
      else{
        if(layout == "FERC/Cost Code Subtotals" || layout == "Cost Type Subtotals"){
          var groupPos = layout == "FERC/Cost Code Subtotals" ? 6 : 5;
          var newGroup = [];
          subTotalRows = [];
          let headerOffset = offSet;
          _.forEach(groupedByKey, function(group, groupKey){
            var orderGroup = _.orderBy(group, groupPos, ['asc']);
            var splitGroup = _.groupBy(orderGroup, groupPos);
            
            _.forEach(splitGroup, function(value, key) {
                let fercRow = groupPos == 6 ? ['', '', '', '', '', '', key + ' Total'] : ['', '', '', groupKey, '', key + ' Total', ''];
                columnNames.forEach(letter => {
                  fercRow.push(`=SUBTOTAL(9,${letter}${headerOffset+1}:${letter}${headerOffset+value.length})`);
                });
                fercRow.push(groupKey);
                value.push(fercRow);
                headerOffset += value.length;
                
                _.forEach(value, function(val) {
                  newGroup.push(val);
                });
  
                subTotalRows.push(headerOffset);
            });
            headerOffset++;
          });
  
          groupedByKey = _.groupBy(newGroup, projectIndex);
          var subTotalRows2 = SheetFormater.mapSubTotalRows(
            groupedByKey,
            offSet + 1,
            layout
          );
          subTotalRows = _.union(subTotalRows, subTotalRows2);
          
        }

        // Remove project key
        _.forEach(groupedByKey, group => {
          _.forEach(group, val => {
            val.pop();
          });
        });


        subTotaled = SheetFormater.addManagerSubTotalRows(
          groupedByKey,
          columnNames,
          offSet,
          rowPadding,
          layout
        );
      }
    }
    else{
      if(layout == "FERC/Cost Code Subtotals" || layout == "Cost Type Subtotals"){
        var groupPos = layout == "FERC/Cost Code Subtotals" ? 5 : 4;
        var newGroup = [];
        subTotalRows = [];
        let headerOffset = offSet;
        _.forEach(groupedByKey, function(group, groupKey){
          var orderGroup = _.orderBy(group, groupPos, ['asc']);
          var splitGroup = _.groupBy(orderGroup, groupPos);
          
          _.forEach(splitGroup, function(value, key) {
              let fercRow = groupPos == 5 ? ['', '', groupKey, '', '', key + ' Total'] : ['', '', groupKey, '', key + ' Total', ''];
              columnNames.forEach(letter => {
                fercRow.push(`=SUBTOTAL(9,${letter}${headerOffset+1}:${letter}${headerOffset+value.length})`);
              });
              value.push(fercRow);
              headerOffset += value.length;
              
              _.forEach(value, function(val) {
                newGroup.push(val);
              });

              subTotalRows.push(headerOffset);
          });
          headerOffset++;
        });

        groupedByKey = _.groupBy(newGroup, projectIndex);
        var subTotalRows2 = SheetFormater.mapSubTotalRows(
          groupedByKey,
          offSet + 1,
          layout
        );
        subTotalRows = _.union(subTotalRows, subTotalRows2);
        
      }
      subTotaled = SheetFormater.addSubTotalRows(
        groupedByKey,
        columnNames,
        offSet,
        rowPadding,
        projects,
        removeSubtotals
      );
    }
    
    // Get rows to hide
    let headerOffset = 6;
    if (options.trend)
      hiddenRows = SheetFormater.mapTrendHiddenRows(
        subTotaled,
        headerOffset,
        options.trend.lastColumn
      );
    else{
      if(!removeSubtotals){
        hiddenRows = SheetFormater.mapHiddenRows(
          subTotaled,
          headerOffset,
          projects,
          managers
        );
      }
    }
    
    // Re flatten data
    let sheetData = _.flatten(subTotaled);
    
    if (layout == "No Details") {
      _.forEach(sheetData, data => {
        data.splice(objectColumn, 2);
      });
    }
    
    if (options.trend) trend = options.trend;
    
    if(hiddenRows) hiddenRowsData = getHiddenJson(hiddenRows);
    
    return {
      sheetData,
      hiddenRows,
      hiddenRowsData,
      subTotalRows,
      sql,
      trend,
      result,
      removeSubtotals
    };
  });
};

module.exports = {
  query,
  jobSheetDataQuery,
  budgetSheetDataQuery,
  budgetSheetFDataQuery,
  reconnect
};