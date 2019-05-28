const _ = require('lodash');

module.exports = {
  mapResultsToArray: (results) => _.map(results, val => _.values(val)),

  mapManagerResultsToArray: (results, managers) => _.map(results, (val) => {
    var rows = _.split(val, ',');
    var project = rows[3].trim();
    var object = rows[4].trim();
    var businessUnit = "Not Assigned in JDE";
    if(project){
      project = project.split(" ");
      businessUnit = project[0];
      project = _.drop(project, 1);

      var projectId = rows[2].trim();
      if(projectId){
        project.splice(0, 0, projectId);
        project = _.join(project, ' ');
      }
      else project = "Not Assigned in JDE";
    }
    if(!object)rows[4] = "(Blank)";

    var projectManager = _.find(managers, { 'mcmcu': businessUnit });
    if(projectManager) rows[2] = projectManager.drdl01;
    else rows[2] = "NONE";

    rows[3] = project;
    rows.splice(4, 0, businessUnit);
    return rows;
  }),
  
  groupByProjectKey: (values, projectIndex) => 
    _.mapValues(_.groupBy(values, projectIndex), val => val == '' || _.isUndefined(val) ? 'Blank': val),

  mapSubTotalRows: (groupedRows, headerOffset) => _.map(groupedRows, val => {
    const row = headerOffset + val.length;
    headerOffset += val.length+1;
    return row;
  }),

  addSubTotalRows: (groupedByKey, columnNames, headerOffset, rowPadding, optionalProjectList) => 
    _.map(groupedByKey, (val, key) => {
      let row = _.clone(rowPadding);

      if (optionalProjectList) {
        var projectListKey = val[0][2].trim();
        var project = _.find(optionalProjectList, { key: projectListKey });
        row.push(project ? project.name : val[0][3]);
        _.times(2, () => row.push(''));
      } else {
        row.push(val[0][2]);
      }
      columnNames.forEach(letter => {
        //row.push(`=SUBTOTAL(9,${letter}${headerOffset}:${letter}${headerOffset+val.length-1}`);
        row.push(`=SUBTOTAL(9,${letter}${headerOffset+1}:${letter}${headerOffset+val.length})`);
      });
      val.push(row);
      headerOffset += val.length;
      return val;
    }),

  addManagerSubTotalRows: (groupedByKey, columnNames, headerOffset, rowPadding) => 
    _.map(groupedByKey, (val, key) => {
      let row = _.clone(rowPadding);
      
      row.push(val[0][3] + " Total");
      _.times(3, () => row.push(''));
      
      columnNames.forEach(letter => {
        row.push(`=SUBTOTAL(9,${letter}${headerOffset+1}:${letter}${headerOffset+val.length})`);
      });
      val.push(row);
      headerOffset += val.length;
      return val;
    }),

  mapHiddenRows: (subTotalRows, headerOffset, optionalProjects) => 
    _.map(subTotalRows, (val) => {
      const range = `A${headerOffset+1}:Z${val.length+(headerOffset-1)}`;
      let key = val[0][3].trim();
      let rows = `[${val.length+headerOffset}]`;
      headerOffset += val.length;

      if (optionalProjects) {
        const projectListKey = val[0][2].trim();
        const project = _.find(optionalProjects, { key: projectListKey });
        key = project ? project.name : val[0][3].trim();
      }

      return { key, range, rows };
    }),
};