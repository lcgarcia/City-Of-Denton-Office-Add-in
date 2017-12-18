const _ = require('lodash');

module.exports = {
  mapResultsToArray: (results) => _.map(results, val => _.values(val)),
  
  groupByProjectKey: (values, projectIndex) => 
    _.mapValues(_.groupBy(values, projectIndex), val => val),

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
        row.push(project ? project.name : projectListKey);
        _.times(2, () => row.push(''));
      } else {
        row.push(val[0][2]);
      }
      columnNames.forEach(letter => {
        //row.push(`=SUBTOTAL(9,${letter}${headerOffset}:${letter}${headerOffset+val.length-1}`);
        row.push(`=SUM(${letter}${headerOffset+1}:${letter}${headerOffset+val.length}`);
      });
      val.push(row);
      headerOffset += val.length;
      return val;
    }),

  mapHiddenRows: (subTotalRows, headerOffset, optionalProjects) => 
    _.map(subTotalRows, (val) => {
      const range = `A${headerOffset+1}:Z${val.length+(headerOffset-1)}`;
      let key = val[0][2];
      headerOffset += val.length;

      if (optionalProjects) {
        const projectListKey = val[0][2].trim();
        const project = _.find(optionalProjects, { key: projectListKey });
        key = project ? project.name : projectListKey;
      }

      return { key, range };
    }),
};