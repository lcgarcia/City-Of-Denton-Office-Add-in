const _ = require('lodash');

var JobCostSQLGenerator = function (options) {
  this.schema = 'proddta'
  this.ctlSchema = 'prodctl';
  if(options && options.schema)
    this.schema = options.schema
  if(options && options.ctlSchema)
    this.ctlSchema = options.ctlSchema

  this.type = ''
  if(options && options.type)
    this.type = options.type
}

JobCostSQLGenerator.prototype.getUIData = function(reportSelected) {
  reportSelected = reportSelected || this.type;
  let queries = {
    years: `select DISTINCT case when gbctry = '20' then '200' ||`
            +`gbfy || ' - ' || '200' ||  TO_NUMBER(gbfy+1, '9G999D99') ELSE '19' || gbfy  `
            +`|| ' - ' || TRIM(TO_CHAR(TO_NUMBER(gbctry*100)+TO_NUMBER(gbfy+1),9999)) END as name `
            +`FROM ${this.schema}.F0902 `
            +`WHERE gbfy <> 0 and gbctry <> 0`,
    projects: `SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name FROM ${this.schema}.F0006 `
               +`WHERE mcstyl = 'PJ'  `
               +`ORDER BY mcmcu`,
    jobs: `SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name FROM ${this.schema}.F0006 `
           +`WHERE MCMCUS like '%XXX%' `
           +`ORDER BY mcmcu`,
    company: this.getCompanySelections('*ALL', reportSelected),
  };
  if (reportSelected == 'ka' || reportSelected == 'new') {
    return _.merge(queries, {
      calendarYears: `select DISTINCT case when gbctry = '20' then '200' ||`
                    +`gbfy  ELSE '19' || gbfy  `
                    +` END as name `
                    +`FROM ${this.schema}.F0902 `
                    +`WHERE gbfy <> 0 and gbctry <> 0`,
      departments: `SELECT trim(drky) as key, trim(drky) || ' ' || drdl01 as name `
                  +`FROM ${this.ctlSchema}.F0005 `
                  +`WHERE drsy='00' and drrt='27' and drky <>' '`,
      catCodeHead: `SELECT dtrt as key, dtrt || ' ' || dtdl01 as name FROM ${this.schema}.F0004 `
                  +`WHERE dtsy = '00' and dtrt between '00' and '30' `,
    });
  } else if (reportSelected == 'e') {
    return _.merge(queries, {
      departments: `SELECT trim(drky) as key, trim(drky) || ' ' || drdl01 as name `
                  +`FROM ${this.ctlSchema}.F0005 `
                  +`WHERE drsy='00' and drrt='27' and drky <>' '`,
    });
  } else {
    return _.merge(queries, {
      departments: `SELECT trim(drky) as key, trim(drky) || ' ' || drdl01 as name `
                  +`FROM ${this.ctlSchema}.F0005 `
                  +`WHERE drsy='00' and drrt='27' and drky not in (' ','60') `,
    })
  }
};

JobCostSQLGenerator.prototype.getJobSelections = function(department, company, project, jobStatus, reportSelected) {
  reportSelected = reportSelected || this.type;
  if (reportSelected === '' || reportSelected === 'e')
    return this.getComplexJobselection(department, company, project, reportSelected);
  else 
    return this.getBasicJobselection(department, company, project, jobStatus);
};

JobCostSQLGenerator.prototype.getBasicJobselection = function(department, company, project, jobStatus) {
  let sql = `SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name FROM ${this.schema}.F0006 `;
  const sort = "ORDER BY mcmcu";
  let departmentWhere, companyWhere, projectWhere, jobWhere;

  if (department != '*ALL') departmentWhere = `mcrp27 = '${department}' `;
  else departmentWhere = `mcrp27 <> '${department}' `;

  if (company != '*ALL') companyWhere = `mcco = '${company}' `;
  else companyWhere = `mcco <> '${company}' `;

  if (project != '*ALL') projectWhere = `mcmcus like '%${project}'% `;
  else projectWhere = `mcco <> '${project}' `;
  projectWhere += " AND substr(mcmcu,10,3) <> 'XXX' ";

  if (jobStatus === 'Open') jobWhere = `mcpecc in (' ','K') `;
  else if (jobStatus === 'Closed') jobWhere = `mcpecc in ('N') `;
  else jobWhere = `mcpecc <> '*ALL' `;

  return `${sql} WHERE ${departmentWhere} AND ${companyWhere} AND ${projectWhere} AND ${jobWhere} ${sort}`;
};

JobCostSQLGenerator.prototype.getComplexJobselection = function(department, company, project, reportSelected) {
  let sql = `SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name FROM ${this.schema}.F0006 `;
  const sort = "ORDER BY mcmcu";
  let where = ''

  if (department === '*ALL' && company === '*ALL' && project === '*ALL') {
    if (reportSelected == '')
      where += `WHERE mcrp27 not in ('${department}', '60') AND mcco <> '${company}' AND mcmcus <> '${project}' `;
    else 
      where += `WHERE mcrp27 <> '${department}' AND mcco <> '${company}' AND mcmcus <> '${project}' `;
  }
  else if (department === '*ALL' && company === '*ALL' && project != '*ALL'){
    if (reportSelected == '')
      where += `WHERE mcrp27<>'60' and mcmcus like '%${project}%' `;
    else 
      where += `WHERE mcmcus like '%${project}%' `;
  }
  else if (department === '*ALL' && company != '*ALL' && project === '*ALL'){
    if (reportSelected == '')
      where += `WHERE mcrp27 not in ('${department}', '60') AND mcco = '${company}' AND mcmcus <> '${project}' `;
    else 
      where += `WHERE mcrp27 <> '${department}' AND mcco = '${company}' AND mcmcus <> '${project}' `;
  }
  else if (department === '*ALL' && company != '*ALL' && project != '*ALL')
    where += `WHERE mcrp27 <> '${department}' AND mcco = '${company}' AND mcmcus = '${project}' `;
  else if (department != '*ALL' && company === '*ALL' && project === '*ALL')
    where += `WHERE mcrp27 = '${department}' AND mcco <> '${company}' AND mcmcus <> '${project}' `;
  else if (department != '*ALL' && company === '*ALL' && project != '*ALL')
    where += `WHERE mcrp27 = '${department}' AND mcco <> '${company}' AND mcmcus = '${project}' `;
  else if (department != '*ALL' && company != '*ALL' && project === '*ALL')
    where += `WHERE mcrp27 = '${department}' AND mcco = '${company}' `;
  else if (department != '*ALL' && company != '*ALL' && project != '*ALL')
    where += `WHERE mcrp27 = '${department}' AND mcco = '${company}' AND mcmcus like '%${project}%' `;
  where += "AND substr(mcmcu,10,3) <> 'XXX'";
  return sql + where + sort;
};

JobCostSQLGenerator.prototype.getProjectSelections = function(department, company, reportSelected) {
  reportSelected = reportSelected || this.type;

  const all = "SELECT trim(mcmcu) as key, trim(mcmcu) || ' ' || mcdl01 as name"
             +`FROM ${this.schema}.F0006 `
             +"WHERE mcstyl = 'PJ'  "
             + (reportSelected === '' ? "and mcrp27 <> '60' " : "")
             +"ORDER BY mcmcu";
  const type1 = "SELECT trim(mcmcu) || ' ' || mcdl01 "
               +`FROM ${this.schema}.F0006 `
               +"WHERE mcstyl = 'PJ'  "
               + (reportSelected === '' ? `AND mcrp27 not in ('${this.department}', '60') ` : `AND mcrp27 <> '${this.department}' `)
               +`AND mcco = '${this.company}'`
               +"ORDER BY mcmcu";
  const type2 = "SELECT trim(mcmcu) || ' ' || mcdl01 "
               +`FROM ${this.schema}.F0006 `
               +"WHERE mcstyl = 'PJ'  "
               +`AND mcrp27 = '${this.department}'`
               +`AND mcco = '${this.company}'`
               +"ORDER BY mcmcu";
  const type3 = "SELECT trim(mcmcu) || ' ' || mcdl01 "
               +`FROM ${this.schema}.F0006 `
               +"WHERE mcstyl = 'PJ'  "
               +`AND mcrp27 = '${this.schema}'`
               +"ORDER BY mcmcu";

  if (department === '*ALL' && company != '*ALL')
    return type1;
  else if (department != '*ALL' && company === '*ALL')
    return type3;
  else if (department != '*ALL' && company != '*ALL')
    return type2;
  else 
    return all;
};

JobCostSQLGenerator.prototype.getCompanySelections = function(department, reportSelected) {
  if(department === '*ALL') {
    return "SELECT ccco as key, ccco || ' ' || ccname as name "
          +`FROM ${this.schema}.F0010 `
          +"WHERE (ccco between '00402' and '00404') OR "
          +"(ccco between '00408' and '00599') OR "
          +"(ccco between '00700' and '00799') OR "
          +"(ccco in ('00605','00632','00635','00642','00645','00665',"
          +"'00803','00805','00823','00825','00833','00835',"
          +"'00915','00916')) "
          +"ORDER BY ccco ";
  } else {
    return "SELECT distinct a.mcco || ' ' || b.ccname as name, a.mcco as key "
          +`FROM ${this.schema}.F0006 a,proddta.F0010 b `
          +"WHERE a.mcco = b.ccco "
          +`AND a.mcrp27 = '${department}'`;
  }
};

JobCostSQLGenerator.prototype.createSelectStatement = function(forMonth, forYear, options) {
  const reportSelected = options.reportSelected || '';
  const select = this.select(reportSelected, forMonth, forYear, options.layout);
  const from = this.from();
  const where = this.where(reportSelected, forYear, options);
  const groupBy = this.groupBy(reportSelected, options.layout);
  const orderBy = this.orderBy(reportSelected, options.layout);

  return select + from + where + groupBy + orderBy;
};

JobCostSQLGenerator.prototype.select = function(reportSelected, forMonth, forYear, layout) {
  reportSelected = reportSelected || this.type;
  var toDateValues = this.ytdAndMTDValues(forMonth);
  var YTD = toDateValues.YTD;
  var MTD = toDateValues.MTD;
  forYear = parseInt(String(forYear).substring(2,4));

  var YTDPNL = `${YTD}-a.GBAPYC`
  var YTDBudget = `${YTD}+a.GBBORG`

  var columns = this.columnsForReport(reportSelected, layout);

  return `SELECT ${columns}`
        +`SUM(CASE WHEN a.GBLT = 'JA' THEN ${YTDBudget} ELSE 0 END)/100 as Budget, `
        +`SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN ${YTD}  ELSE 0 END)/100 as Act, `
        +`SUM(CASE WHEN a.GBLT = 'JA' THEN ${YTDBudget} ELSE 0 END)/100 - `
        +`SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN ${YTD} ELSE 0 END)/100 as Remaining, `
        +`SUM(CASE WHEN a.GBLT = 'PA' THEN ${YTD}  ELSE 0 END)/100 as Encumbrance, `
        +`SUM(CASE WHEN a.GBLT = 'JA' THEN ${YTDBudget} ELSE 0 END)/100 - `
        +`SUM(CASE WHEN a.GBOBJ between '1340' and '1370' and a.GBLT = 'AA' THEN ${YTD} ELSE 0 END)/100 - `
        +`SUM(CASE WHEN a.GBLT = 'PA' THEN ${YTD} ELSE 0 END)/100 as Unencumbered `;
};

JobCostSQLGenerator.prototype.columnsForReport = function(reportSelected, layout) {
  if(reportSelected == 'ka' || reportSelected == 'new') {
    if (layout == 'No Details')
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit, "
    else if (_.includes(['Cost Code/Type Details', 'FERC/Cost Code Subtotals', 'Cost Type Subtotals'], reportSelected))
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,a.GBOBJ as Object,a.GBSUB as Sub, "
  } else if(reportSelected == 'e') {
    if (layout == 'No Details')
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit, "
    else if (_.includes(['Cost Code/Type Details', 'FERC Details'], reportSelected))
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,a.GBOBJ as Object,a.GBSUB as Sub, "
  } else {
    if (layout == 'No Details')
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit, "
    else if (layout == 'Cost Code/Type Details')
      return "b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,a.GBOBJ as Object,a.GBSUB as Sub, "
  }
};

JobCostSQLGenerator.prototype.from = function() {
  return `FROM ${this.schema}.F0902 a,${this.schema}.F0006 b `
};

JobCostSQLGenerator.prototype.where = function(reportSelected, year, options) {
  const department = this.getDepartmentString(options.department);
  const company = this.getCompanyString(options.company);
  const project = this.getProjectString(options.project);
  let job = this.getJobString(options.job, options.status);


  year = `a.GBFY = ${String(year).substring(2,4)}`

  let whereStr = `WHERE a.gbmcu = b.mcmcu AND a.GBLT in ('AA','PA','JA') AND b.mcstyl = 'JB' AND ${department} AND ${company} AND ${project} AND ${job} AND ${year} `;

  if (reportSelected == 'ka' || reportSelected == 'new') {
    const catCodes = this.getCatCodeString(options.catField, options.catField1, options.catCode, options.catCode1);
    return `${whereStr} AND ${catCodes.cat} AND ${catCodes.cat1} `;
  } else return whereStr;
};

JobCostSQLGenerator.prototype.getCatCodeString = function(catField, catField1, catCode, catCode1) {
  let cat;
  let cat1;
  let tmp;
  let tmp1;

  switch(catField) {
    case '*A':
    case '*ALL':
    case '--':
      cat = "b.MCRP01<>'*ALL' "
      break;
    default:
      tmp = `b.MCRP${catField}`
  };

  switch(catField1) {
    case '*A':
    case '*ALL':
    case '--':
      cat1 = "b.MCRP02<>'*ALL' "
      break;
    default:
      tmp1 = `b.MCRP${catField1}`
  };

  switch(catCode) {
    case '*AL':
    case '*ALL':
    case '--':
      cat = "b.MCRP01<>'*ALL'"
      break;
    default:
      cat = `${tmp} = '${catCode}'`
  };

  switch(catCode1) {
    case '*AL':
    case '*ALL':
    case '--':
      cat1 = "b.MCRP01<>'*ALL'"
      break;
    default:
      cat1 = `${tmp1} = '${catCode1}'`
  };

  return { cat, cat1 };
};

JobCostSQLGenerator.prototype.getJobString = function(job, status) {
  let jobStr;
  if (job == '*ALL') jobStr = "a.GBMCU <> '*ALL' "
  else jobStr = `a.GBMCU like '%${job.substring(0,9)}' `

  if(status == 'Closed') return `${jobStr} and b.MCPECC = 'N' `
  else if (status == 'Open') return `${jobStr} and b.MCPECC in (' ','K') `
  else return jobStr
};

JobCostSQLGenerator.prototype.getProjectString = function(project) {
  if (project == '*ALL') return "b.MCMCUS <> '*ALL' "
  else return `b.MCMCUS like '%${project.substring(0,9)}%' `
};

JobCostSQLGenerator.prototype.getCompanyString = function(company) {
  if (company == '*ALL') return "a.GBCO <> '*ALL' "
  else return `a.GBCO = '${company.substring(0,5)}' `
};

JobCostSQLGenerator.prototype.getDepartmentString = function(department) {
  if (department == '*ALL') return "b.MCRP27 <> '60' "
  else return `b.MCRP27 = '${department.substring(0,2)}' `
};

JobCostSQLGenerator.prototype.groupBy = function(reportSelected, layout) {
  if(reportSelected == 'e') {
    const expandedGroup = ['Cost Code/Type Details', 'FERC Details'];

    if (layout == 'No Details') return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 "
    else if (_.includes(expandedGroup,layout)) return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01,a.GBOBJ,a.GBSUB "
    else return ''
  } else if (reportSelected == 'ka' || reportSelected == 'new') {
    const expandedGroup = ['Cost Code/Type Details', 'FERC/Cost Code Subtotals', 'Cost Type Subtotals'];

    if (layout == 'No Details') return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 "
    else if (_.includes(expandedGroup,layout)) return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01,a.GBOBJ,a.GBSUB "
    else return ''
  } else {
    if (layout == 'No Details') return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 "
    else if (layout == 'Cost Code/Type Details') return "GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01,a.GBOBJ,a.GBSUB "
    else return ''
  }
};

JobCostSQLGenerator.prototype.orderBy = function(reportSelected, layout) {
  if(reportSelected == 'e') {
    if (layout == 'FERC Details') return "ORDER BY 3,6,5 "
    else return "ORDER BY 3,4,1,2 "
  } else if (reportSelected == 'ka') {
    if(layout == 'FERC/Cost Code Subtotals') return "ORDER BY 3,6,5 "
    else if (layout == 'Cost Type Subtotals') return "ORDER BY 3,5,6 "
    else return "ORDER BY 3,4,1,2 "
  } else {
    return 'ORDER BY 3,4,1,2 ';
  }
};

/**
 * Generate the YTD and MTD string values to be used in an query
 *
 * @param      {String}  forMonth  For month
 * @return     {Object}  Object containing a YTD and MTD SQL string
 */
JobCostSQLGenerator.prototype.ytdAndMTDValues = function (forMonth) {
  var YTD = '';
  var MTD = '';
  switch(forMonth) {
    case '13th':
      MTD = 'a.GBAN13'
      YTD = 'a.GBAN13'
      YTDBUD = `${YTD}+a.GBBORG`
    case 'Sep':
      MTD = MTD == '' ? 'a.GBAN12' : MTD
      MTD = MTD == '' ? 'a.GBAN12' : MTD
      YTD = `a.GBAN12+${YTD}`
    case 'Aug':
      MTD = MTD == '' ? 'a.GBAN11' : MTD
      YTD = `a.GBAN11+${YTD}`
    case 'Jul':
      MTD = MTD == '' ? 'a.GBAN10' : MTD
      YTD = `a.GBAN10+${YTD}`
    case 'Jun':
      MTD = MTD == '' ? 'a.GBAN09' : MTD
      YTD = `a.GBAN09+${YTD}`
    case 'May':
      MTD = MTD == '' ? 'a.GBAN08' : MTD
      YTD = `a.GBAN08+${YTD}`
    case 'Apr':
      MTD = MTD == '' ? 'a.GBAN07' : MTD
      YTD = `a.GBAN07+${YTD}`
    case 'Mar':
      MTD = MTD == '' ? 'a.GBAN06' : MTD
      YTD = `a.GBAN06+${YTD}`
    case 'Feb':
      MTD = MTD == '' ? 'a.GBAN05' : MTD
      YTD = `a.GBAN05+${YTD}`
    case 'Jan':
      MTD = MTD == '' ? 'a.GBAN04' : MTD
      YTD = `a.GBAN04+${YTD}`
    case 'Dec':
      MTD = MTD == '' ? 'a.GBAN03' : MTD
      YTD = `a.GBAN03+${YTD}`
    case 'Nov':
      MTD = MTD == '' ? 'a.GBAN02' : MTD
      YTD = `a.GBAN02+${YTD}`
    case 'Oct':
      MTD = MTD == '' ? 'a.GBAN01' : MTD
      YTD = `a.GBAPYC+a.GBAN01+${YTD}`
  }
  YTD = YTD[YTD.length-1] == '+' ? YTD.substring(0,YTD.length-1) : YTD
  return {YTD: YTD, MTD: MTD}
};

module.exports = JobCostSQLGenerator;