/**
 * SQL Generator class. Currently only for the budrpt-90 spreadsheet.
 * We should be able to use the options params to extend this functionality for
 * the other spreadsheets.
 *
 * @class      SQLGenerator (name)
 * @param      {object}  Optinal params
 */
var SQLGenerator = function (options) {
	this.schema = 'proddta'
	if(options && options.schema)
		this.schema = options.schema
}

SQLGenerator.prototype.createSelectStatement = function (adHoc, reportSelected, forYear, forMonth, accounts, optionals) {
	var select = this.select(reportSelected, forMonth, forYear)
	var from = this.from()

	var whereData = {
		accounts: accounts,
		forYear: forYear
	}
	if(adHoc) {
		whereData.companyKey = optionals.companyKey
		whereData.businessUnitKey = optionals.businessUnitKey
	} else {
		whereData.buLevel = optionals.buLevel
		whereData.key = optionals.key
	}
	var where = this.whereClause(whereData)

	var groupBy = this.groupBy()

	var orderBy = 'ORDER BY b.GMOBJ,b.GMSUB,b.GMLDA'

	// Maybe I need carrage returns
	return `${select} ${from} ${where} ${groupBy} ${orderBy}`
};

/**
 * Generates the select part of an SQL statement
 *
 * @param      {string}  reportSelected  The report selected
 * @param      {string}  forMonth        For month
 * @param      {number}  forYear         For year
 * @return     {string}  This returns the Select portion of an SQL statement
 */
SQLGenerator.prototype.select = function (reportSelected, forMonth, forYear) {
	var toDateValues = this.ytdAndMTDValues(forMonth);
	var YTD = toDateValues.YTD;
	var MTD = toDateValues.YTD;

	var YTDPNL = forMonth != 'Jul' ? `${YTD}-a.GBAPYC` : ''
	
	// This variable is not used
	var YTDBudget = forMonth != 'Jun' ? `${YTD}+a.GBBORG` : `${YTD}+a.GBAPYC+a.GBBORG`

	var annualPNL = 'a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13'
	var annualBS = 'a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13'
	var originalBudget = 'a.GBBORG'

	var income = reportSelected == 'Income Statement' ? true : false

	var select = `SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,`
	select += `SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = ${forYear-1} THEN ${income ? annualPNL : annualBS} ELSE 0 END)/100 as PriorAnnualAct, `
	select += `SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = ${forYear-1} THEN ${income ? YTDPNL : YTD} ELSE 0 END)/100 as PriorYTDAct, `
	select += `SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = ${forYear} THEN ${income ? originalBudget : annualBS} ELSE 0 END)/100 as CurrentOrigBud, `
	select += `SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = ${forYear} THEN ${income ? annualPNL : originalBudget} ELSE 0 END)/100 as CurrentModBud, `
	select += `SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = ${forYear} THEN ${income ? annualPNL : annualBS} ELSE 0 END)/100 - `
	select += `SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = ${forYear} THEN ${YTD} ELSE 0 END)/100 - `
	select += `SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = ${forYear} THEN ${income ? YTDPNL : YTD} ELSE 0 END)/100 as CurrentAvailBal, `
	select += `SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = ${forYear} THEN ${income ? YTDPNL : YTD} ELSE 0 END)/100 as CurrentYTDBud, `
	select += `SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = ${forYear} THEN ${YTD} ELSE 0 END)/100 as CurrentYTDEnc, `
	select += `SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = ${forYear} THEN ${income ? YTDPNL : YTD} ELSE 0 END)/100 as CurrentYTDAct, `
	select += `SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = ${forYear} THEN ${YTD} ELSE 0 END)/100 +`
	select += `SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = ${forYear} THEN ${income ? YTDPNL : YTD} ELSE 0 END)/100 as CurrentYTDTotal, `
	select += `SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = ${forYear} THEN ${MTD} ELSE 0 END)/100 as CurrentPTDBud, `
	select += `SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = ${forYear} THEN ${MTD} ELSE 0 END)/100 as CurrentPTDEnc, `
	select += `SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = ${forYear} THEN ${MTD} ELSE 0 END)/100 as CurrentPTDAct, `
	select += `SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = ${forYear} THEN ${MTD} ELSE 0 END)/100 + `
	select += `SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = ${forYear} THEN ${MTD} ELSE 0 END)/100 as CurrentPTDTotal, `
	select += `SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = ${forYear+1} THEN ${income ? originalBudget : annualBS} ELSE 0 END)/100 as ProposedAnnualBud `

	return select
};

/**
 * Generate the YTD and MTD string values to be used in an query
 *
 * @param      {String}  forMonth  For month
 * @return     {Object}  Object containing a YTD and MTD SQL string
 */
SQLGenerator.prototype.ytdAndMTDValues = function (forMonth) {
	var YTD = '';
	var MTD = '';
	switch(forMonth) {
		case '13th':
			MTD = 'a.GBAN13'
			YTD = 'a.GBAN13'
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

/**
 * Generates the where part of the SQL statement
 *
 * @param      {object}  data    Acceptable object examples are
 * 								{buLevel:String, key:String, accounts:String, forYear:Number} Or
 * 								{companyKey:String, businessUnitKey:String, accounts:String, forYear:Number}
 * @return     {string} Where part of the SQL statement
 */
SQLGenerator.prototype.whereClause = function (data) {
	var where = 'buLevel' in data ? 
		this.businessLevelWhere(data.buLevel, data.key) : 
		this.adHocWhere(data.companyKey, data.businessUnitKey)
	

	var sql = `WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ ${data.accounts})) AND ((${where}))`
		sql += ` AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL ))`
		sql += ` AND ((a.GBFY in (${data.forYear-1},${data.forYear},${data.forYear+1}) OR a.GBFY IS NULL )))`
	return sql
};

/**
 * Generates where part of the SQL Statement
 *
 * @param      {string}  buLevel   The bu level
 * @param      {string}  key       The key
 * @return     {string}  Alternate where part for business unit level
 */
SQLGenerator.prototype.adHocWhere = function (companyKey, businessUnitKey) {
	var company = companyKey && companyKey != '' ? `b.GMCO in (${companyKey})` : ''
	var businessUnit = businessUnitKey && businessUnitKey != '' ? `b.GMMCU in (${businessUnitKey})` : ''
	var where = company != '' ? company : ''
	where += where != '' ? (businessUnit != '' ? ` OR ${businessUnit}` : '') : businessUnit

	return where
}

/**
 * Generates where part of the SQL Statement
 *
 * @param      {string}  buLevel   The bu level
 * @param      {string}  key       The key
 * @return     {string}  Alternate where part for business unit level
 */
SQLGenerator.prototype.businessLevelWhere = function (buLevel, key) {
	var where;
	switch(buLevel.toLowerCase()) {
		case 'comp': 
			where = `b.GMCO = '${key.substring(0,5)}' `
			break
		case 'busu':
			// Note: We need to be sure the repeat will repeat the same
			//       number of characters as the VBA version of this
			where = `b.GMMCU = '${' '.repeat(12 - key.length) + key}' `
			break
	}

	return where
}

/**
 * Gets the from statement for all quries. For the most part this should be static.
 *
 * @return     {string}  From SQL partial
 */
SQLGenerator.prototype.from = function () {
	return `FROM ${this.schema}.F0901 as b,${this.schema}.F0902 as a `
}

/**
 * Gets the group by statement for all queries. This is static.
 *
 * @return     {string}  Group by SQL partial
 */
SQLGenerator.prototype.groupBy = function () {
	return `GROUP BY a.GBCO,b.GMOBJ,b.BMSUB,b.GMLDA,trim(b.GMDL01)`	
}

module.exports = SQLGenerator