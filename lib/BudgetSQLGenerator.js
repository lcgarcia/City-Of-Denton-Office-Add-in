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

BudgetSQLGenerator.prototype.getFERCData = function() {
	return `SELECT DISTINCT a.gbsbl as subledger, b.abalph FROM proddta.f0902 a,proddta.f0101 b WHERE a.gbco = '00600' and a.gblt in ('AA','BA','PA','B3')  AND to_number(decode(a.gbsbl,'     ','0',LTRIM(substr(a.gbsbl,5)),' ')) = b.aban8(+) AND a.gbobj >='4000' ORDER BY 1`;
};

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
	var select = this.select(accounts, forMonth, forYear)
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
	if (forMonth !== '13th')
    forMonth = forMonth.substr(0, 3);
	var toDateValues = this.ytdAndMTDValues(forMonth);
	var YTD = toDateValues.YTD;
	var MTD = toDateValues.MTD;
	forYear = parseInt(String(forYear).substring(2,4));

	var YTDPNL = `${YTD}-a.GBAPYC`;
	//var YTDPNL = forMonth != 'Jul' ? `${YTD}-a.GBAPYC` : ''
	
	// This variable is not used
	var YTDBudget = forMonth != 'Jun' ? `${YTD}+a.GBBORG` : `${YTD}+a.GBAPYC+a.GBBORG`

	var annualPNL = 'a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13'
	var annualBS = 'a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13'
	var originalBudget = 'a.GBBORG'

	var income = reportSelected.toLowerCase() == "between '4000' and '9999'" ? true : false;

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
			where = `${prefix}CO = '${key}' `
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

BudgetSQLGenerator.prototype.getSubledger = function() {
	return `in ('        ','     460','     580','     583','     588','     830','    5600','    5800','    5820','    5830','    5840','    5850','    5860','    5880','    5940','  000093','  600001','  600110','  600200','  600300','  600400','  600500','  600600','  600800','  600900','  630450','  640001','  840100','00000417','00000440','00000460','00000480','00000540','00000560','00000562','00000580','00000583','00000584','00000586','00000588','00000599','00000620','00000830','00000910','00000920','00000930','00002210','00003110','00003120','00003140','00003160','00003500','00003520','00003530','00003540','00003550','00003560','00003570','00003580','00003600','00003610','00003620','00003630','00003640','00003641','00003650','00003651','00003660','00003661','00003669','00003670','00003671','00003680','00003681','00003690','00003691','00003700','00003710','00003720','00003730','00003731','00003820','00003830','00003890','00003900','00003910','00003920','00003930','00003940','00003950','00003960','00003970','00003980','00004030','00004080','00004150','00004170','00004171','00004172','00004173','00004174','00004175','00004190','00004210','00004260','00004270','00004312','00004360','00004400','00004420','00004440','00004450','00004490','00004510','00004560','00005000','00005010','00005020','00005050','00005060','00005061','00005068','00005069','00005100','00005110','00005120','00005130','00005140','00005350','00005360','00005380','00005390','00005400','00005440','00005450','00005460','00005550','00005555','00005600','00005610','00005615','00005620','00005630','00005650','00005660','00005670','00005680','00005690','00005700','00005730','00005750','00005800','00005808','00005810','00005820','00005830','00005840','00005850','00005860','00005870','00005880','00005881','00005882','00005886','00005887','00005890','00005900','00005910','00005920','00005930','00005940','00005950','00005960','00005968','00005970','00005980','00009020','00009030','00009040','00009060','00009080','00009120','00009130','00009160','00009200','00009201','00009202','00009205','00009210','00009218','00009230','00009240','00009260','000093  ','00009300','00009330','00009350','00014014','00014015','00014021','00092000','00213495','00392104','00392411','00457537','00493221','00514562','00537182','00685011')`;
};

module.exports = BudgetSQLGenerator