/**
 * SQL Generator class.
 * We should be able to use the options params to extend this functionality for
 * the other spreadsheets.
 * 
 * Current support 
 * - Budrpt-90
 * - Budrpt_f-90
 *
 * @class      BudgetSQLGenerator (name)
 * @param      {object}  Optinal params
 */
var BudgetSQLGenerator = function (options) {
	this.schema = 'proddta'
	if(options && options.schema)
		this.schema = options.schema

	this.type = ''
	if(options && options.type)
		this.type = options.type
}

BudgetSQLGenerator.prototype.getBusinessUnitData = function(reportSelected) {
	reportSelected = reportSelected || this.type;
	let sql = "SELECT a.mcco,b.ccname,a.mcmcu,a.mcdl01 "
				+"FROM proddta.f0006 a,proddta.f0010 b " 
				+"WHERE a.mcco = b.ccco and a.mcpecc <> 'N' and b.ccco not between '00401' and '00599' "
				+"AND b.ccco not in ('00600','00601','00603','00609','00631','00633','00641','00643','00663', ";
	switch(reportSelected) {
		case 'a':
			return "SELECT a.mcco,b.ccname,a.mcmcu,a.mcdl01 "
				+"FROM proddta.f0006 a,proddta.f0010 b "
				+"WHERE a.mcco = b.ccco and a.mcpecc <> 'N' "
				+"ORDER by 1,3 ";
		case 'f':
			return "SELECT a.mcco,b.ccname,a.mcmcu,a.mcdl01 "
             +"FROM proddta.f0006 a,proddta.f0010 b "
             +"WHERE a.mcco = b.ccco and a.mcpecc <> 'N' and b.ccco = '00600' "
             +"ORDER by 1,3 "
		case 'e':
			sql = "SELECT a.mcco,b.ccname,a.mcmcu,a.mcdl01 "
				+"FROM proddta.f0006 a,proddta.f0010 b " 
				+"WHERE a.mcco = b.ccco and a.mcpecc <> 'N' and b.ccco not between '00401' and '00599' "
				+"AND b.ccco not in ('00601','00603','00609','00631','00633','00641','00643','00663', ";
		default: 
			sql += "'00803','00813','00823','00833','00999', "
				+"'00700', '00701', '00702', '00703', '00704', '00705', '00706', '00707', '00708', '00709', '00710',  "
				+"'00711', '00712', '00713', '00714', '00715', '00716', '00717', '00718', '00719', '00720', '00721',  "
				+"'00722', '00723', '00724', '00725', '00726', '00727', '00728', '00729', '00730', '00731', '00732',  "
				+"'00733', '00734', '00735', '00736', '00737', '00738', '00739', '00740', '00741', '00742', '00743',  "
				+"'00744', '00745', '00746', '00747', '00748', '00749', '00750', '00751', '00752', '00753', '00754',  "
				+"'00755', '00756', '00757', '00758', '00759', '00760', '00761', '00762', '00763', '00764', '00765',  "
				+"'00766', '00767', '00768', '00769', '00770', '00771', '00772', '00773', '00774', '00775', '00776',  "
				+"'00777', '00778', '00779', '00780', '00781', '00782', '00783', '00784', '00785', '00786', '00787',  "
				+"'00788', '00789', '00790', '00791', '00792', '00793', '00794', '00795', '00796', '00797', '00798',  "
				+"'00799') "
				+"ORDER by 1,3 ";
	};
	return sql;
};

BudgetSQLGenerator.prototype.createSelectStatement = function (adHoc, reportSelected, forYear, forMonth, accounts, optionals) {
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

	switch(this.type) {
		case 'f':
			whereData.subledgers = optionals.subledgers
			break
		default:
			break
	}

	var where = this.whereClause(whereData)

	var groupBy = this.groupBy()

	var orderBy = 'ORDER BY b.GMOBJ,b.GMSUB,b.GMLDA'
	switch(this.type) {
		case 'f':
			orderBy = 'ORDER BY 2,4'
			break
		default: 
			orderBy = 'ORDER BY b.GMOBJ,b.GMSUB,b.GMLDA'
			break
	}

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
BudgetSQLGenerator.prototype.select = function (reportSelected, forMonth, forYear) {
	var toDateValues = this.ytdAndMTDValues(forMonth);
	var YTD = toDateValues.YTD;
	var MTD = toDateValues.MTD;
	forYear = parseInt(String(forYear).substring(2,4));

	var YTDPNL = forMonth != 'Jul' ? `${YTD}-a.GBAPYC` : ''
	
	// This variable is not used
	var YTDBudget = forMonth != 'Jun' ? `${YTD}+a.GBBORG` : `${YTD}+a.GBAPYC+a.GBBORG`

	var annualPNL = 'a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13'
	var annualBS = 'a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13'
	var originalBudget = 'a.GBBORG'

	var income = reportSelected == 'Income Statement' ? true : false

	var select = ''
	switch(this.type) {
		case 'f':
			select = `SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' `
			select += `ELSE '2EXPENDITURES' `
			select += `END) as section, `
			select += `(CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, `
			select += `b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,`
			break
		default: 
			select = `SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,`		
			break
	}

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
	select += `SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = ${forYear} THEN ${MTD} ELSE 0 END)/100 as CurrentPTDAct, `
	select += `SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = ${forYear} THEN ${MTD} ELSE 0 END)/100 + `
	select += `SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = ${forYear} THEN ${MTD} ELSE 0 END)/100 as CurrentPTDTotal, `
	select += `SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = ${forYear+1} THEN ${income ? originalBudget : annualBS} ELSE 0 END)/100 as ProposedAnnualBud `

	return select
};

/**
 * Generate the YTD and MTD string values to be used in an query
 *
 * @param      {String}  forMonth  For month
 * @return     {Object}  Object containing a YTD and MTD SQL string
 */
BudgetSQLGenerator.prototype.ytdAndMTDValues = function (forMonth) {
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
 * 								
 * 								NOTE - If you are using budrpt_f you will need to also have data.subledgers
 * 									   as a part of your object.
 * 								
 * @return     {string} Where part of the SQL statement
 */
BudgetSQLGenerator.prototype.whereClause = function (data) {
	var where = 'buLevel' in data ? 
		this.businessLevelWhere(data.buLevel, data.key) : 
		this.adHocWhere(data.companyKey, data.businessUnitKey)
	
	var sql
	switch(this.type) {
		case 'f':
			sql = `WHERE (((a.GBAID = c.GMAID)) AND `
			sql += `((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) `
			sql += `AND ((a.GBOBJ ${data.accounts})) AND ((${where})) `
			sql += `AND ((a.GBSBL ${data.subledgers}))`
			sql += ` AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL ))`
			break
		case 'e':
		case 'a':
			sql = `WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ ${data.accounts})) AND ((${where}))`
			sql += ` AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL ))`
			break
		default:
			sql = `WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ ${data.accounts})) AND ((${where}))`
			sql += ` AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL ))`
			break
	}

	const year = parseInt(String(data.forYear).substring(2,4));

	sql += ` AND ((a.GBFY in (${year-1},${year},${year+1}) OR a.GBFY IS NULL )))`
	
	return sql
};

/**
 * Generates where part of the SQL Statement
 *
 * @param      {string}  buLevel   The bu level
 * @param      {string}  key       The key
 * @return     {string}  Alternate where part for business unit level
 */
BudgetSQLGenerator.prototype.adHocWhere = function (companyKey, businessUnitKey) {
	var prefix = 'b.GM'
	switch(this.type) {
		case 'f':
			prefix = 'a.GB'
			break
		default:
			prefix = 'b.GM'
			break
	}

	var company = companyKey && companyKey != '' ? `${prefix}CO in (${companyKey})` : ''
	var businessUnit = businessUnitKey && businessUnitKey != '' ? `${prefix}MCU in (${businessUnitKey})` : ''
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
BudgetSQLGenerator.prototype.businessLevelWhere = function (buLevel, key) {
	var where;
	var prefix = 'b.GM'

	switch(this.type) {
		case 'f':
			prefix = 'a.GB'
			break
		default:
			break
	}

	switch(buLevel.toLowerCase()) {
		case 'comp': 
			where = `${prefix}CO = '${key.substring(0,5)}' `
			break
		case 'busu':
			// Note: We need to be sure the repeat will repeat the same
			//       number of characters as the VBA version of this
			where = `${prefix}MCU = '${' '.repeat(12 - key.length) + key}' `
			break
	}

	return where
}

/**
 * Gets the from statement for all quries. For the most part this should be static.
 *
 * @return     {string}  From SQL partial
 */
BudgetSQLGenerator.prototype.from = function () {
	switch(this.type) {
		case 'f':
			return `FROM ${this.schema}.F0902 a,${this.schema}.F0101 b,${this.schema}.F0901 c `
			break
		default:
			return `FROM ${this.schema}.F0901 b,${this.schema}.F0902 a `
			break
	}
}

/**
 * Gets the group by statement for all queries. This is static.
 *
 * @return     {string}  Group by SQL partial
 */
BudgetSQLGenerator.prototype.groupBy = function () {
	switch(this.type) {
		case 'f':
			var group = `GROUP BY (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' `
				group += `ELSE '2EXPENDITURES' `
				group += `END),`
				group += `(CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END), `
				group += `b.ABALPH,a.GBOBJ,trim(c.GMDL01)`
			return group
			break
		default:
			return `GROUP BY a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01)`	
			break
	}
}

module.exports = BudgetSQLGenerator