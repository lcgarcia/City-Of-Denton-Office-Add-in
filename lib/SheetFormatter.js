const _ = require('lodash');

module.exports = {
  mapResultsToArray: (results, showBlank) => _.map(results, val => {
    if (showBlank && val.OBJECT && !val.OBJECT.trim()) val.OBJECT = "(Blank)";
    return _.values(val)
  }),
  
  mapManagerResultsToArray: (results, managers) => _.map(results, (val) => {
    var rows = _.clone(val);
    var project = rows[3].trim();
    var object = rows[4].trim();
    var businessUnit = "Not Assigned in JDE";
    
    if (project) {
      project = project.split(" ");
      businessUnit = project[0];
      project = _.drop(project, 1);
      
      var projectId = rows[2].trim();
      if (projectId) {
        project.splice(0, 0, projectId);
        project = _.join(project, ' ');
      }
      else project = "Not Assigned in JDE";
    }
    if (!object) rows[4] = "(Blank)";
    
    var projectManager = _.find(managers, {
      'mcmcu': businessUnit
    });
    if (projectManager) rows[2] = projectManager.drdl01;
    else rows[2] = "NONE";
    
    rows[3] = project;
    rows.splice(4, 0, businessUnit);
    rows.push(val[2]);
    
    return rows;
  }),
  
  mapTrendResultsToArray: (results, managers) => _.map(results, (val) => {
    var value = val[2];
    var project = value.trim();
    var businessUnit = "Not Assigned in JDE";
    if (project) businessUnit = project;
    
    var projectManager = _.find(managers, {
      'mcmcu': businessUnit
    });
    if (projectManager) val[2] = projectManager.drdl01;
    val.push(value);
    return val;
  }),
  
  groupByProjectKey: (values, projectIndex) =>
    _.mapValues(_.groupBy(values, projectIndex), val => val == '' || _.isUndefined(val) ? 'Blank' : val),
  
  mapSubTotalRows: (groupedRows, headerOffset, layout) => _.map(groupedRows, val => {
    //const isFerc = layout == "FERC Details" || layout == "FERC/Cost Code Subtotals" || layout == "Cost Type Subtotals";
    const row = headerOffset + val.length;
    //const offset = isFerc ? val.length + 2 : val.length + 1;
    headerOffset += val.length + 1;
    return row;
  }),
  
  addSubTotalRows: (groupedByKey, columnNames, headerOffset, rowPadding, optionalProjectList, removeSubtotals) =>
    _.map(groupedByKey, (val, key) => {
      if(!removeSubtotals){
        let row = _.clone(rowPadding);
        
        if (optionalProjectList) {
          var projectListKey = val[0][2].trim();
          var project = _.find(optionalProjectList, {
            key: projectListKey
          });
          row.push(project ? project.name : val[0][3]);
          _.times(2, () => row.push(''));
        }
        else {
          row.push(val[0][2]);
        }
        columnNames.forEach(letter => {
          row.push(`=SUBTOTAL(9,${letter}${headerOffset+1}:${letter}${headerOffset+val.length})`);
        });
        val.push(row);
        
        headerOffset += val.length;
      }
      return val;
    }),
  
  addFSubTotalRows: (groupedByKey, columnNames, headerOffset) =>
    _.map(groupedByKey, (val, key) => {
      let row = [''];
      row.push("'" + val[0][19]);
      row.push('');
      row.push('');
      if (val[0][2]) row.push(val[0][2]);
      else row.push("NO SUBLEDGER DESCRIPTION FOUND");
      columnNames.forEach(letter => {
        row.push(`=SUBTOTAL(9,${letter}${headerOffset}:${letter}${headerOffset+val.length-1})`);
      });
      val.push(row);
      headerOffset += val.length;
      return val;
    }),
  
  addManagerSubTotalRows: (groupedByKey, columnNames, headerOffset, rowPadding, layout) =>
    _.map(groupedByKey, (val, key) => {
      let row = _.clone(rowPadding);
      
      row.push(val[val.length - 1][2]);
      row.push(val[0][3] + " Total");
      _.times(3, () => row.push(''));
      
      columnNames.forEach(letter => {
        row.push(`=SUBTOTAL(9,${letter}${headerOffset+1}:${letter}${headerOffset+val.length})`);
      });
      
      val.push(row);
      headerOffset += val.length;
      return val;
    }),
  
  addTrendSubTotalRows: (groupedByKey, headerOffset, rowPadding, trendPeriods) =>
    _.map(groupedByKey, (val, key) => {
      var alphaMap = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      let row = _.clone(rowPadding);
      row.push(val[0][2] + " Total");
      _.times(3, () => row.push(''));
      
      var rowCount = 0;
      var alphaKey1 = 0;
      var alphaKey2 = 7;
      while (rowCount < trendPeriods) {
        row.push(`=SUBTOTAL(9,${alphaMap[alphaKey1]}${alphaMap[alphaKey2]}${headerOffset+1}:${alphaMap[alphaKey1]}${alphaMap[alphaKey2]}${headerOffset+val.length})`);
        alphaKey2++;
        rowCount++;
        if (alphaKey2 == alphaMap.length) {
          alphaKey1++;
          alphaKey2 = 1;
        }
      }
      
      val.push(row);
      headerOffset += val.length;
      return val;
    }),
  
  mapFHiddenRows: (subTotalRows, headerOffset) =>
    _.map(subTotalRows, (val) => {
      const range = `A${headerOffset+1}:Z${val.length+(headerOffset-1)}`;
      let len = val.length - 1;
      var key;
      if (len >= 0) key = val[len][4].trim();
      else key = "";
      
      let subTotalRow = val.length + headerOffset - 1;
      let rows = `[${val.length+headerOffset}]`;
      headerOffset += val.length;
      return {
        key,
        range,
        rows,
        subTotalRow
      };
    }),
  
  mapHiddenRows: (subTotalRows, headerOffset, optionalProjects) =>
    _.map(subTotalRows, (val) => {
      const range = `A${headerOffset+1}:Z${val.length+(headerOffset-1)}`;
      let key = val[0][3].trim();
      let rows = `[${val.length+headerOffset}]`;
      headerOffset += val.length;
      
      if (optionalProjects) {
        const projectListKey = val[0][2].trim();
        const project = _.find(optionalProjects, {
          key: projectListKey
        });
        key = project ? project.name : val[0][3].trim();
      }
      
      return {
        key,
        range,
        rows
      };
    }),
  
  mapTrendHiddenRows: (subTotalRows, headerOffset, lastColumn) =>
    _.map(subTotalRows, (val) => {
      const range = `A${headerOffset+1}:${lastColumn}${val.length+(headerOffset-1)}`;
      let key = val[0][2].trim();
      let rows = `[${val.length+headerOffset}]`;
      headerOffset += val.length;
      
      return {
        key,
        range,
        rows
      };
    }),
};