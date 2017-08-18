var chai = require('chai')
var expect = chai.expect
// We may need fuzzy later so I included it as a dev dependancy just incase
//chai.use(require('chai-fuzzy'))

describe('SQL Generator individual function tests for Budrpt-90', () => {
	var Generator = require('./../lib/SQLGenerator')
	var generator = new Generator()

	it('from() should return default from SQL partial', () => {
		expect(generator.from()).to.be.equal('FROM proddta.F0901 as b,proddta.F0902 as a ')
	})

	it('groupBy() should return static group by SQL partial', () => {
		expect(generator.groupBy()).to.be.equal('GROUP BY a.GBCO,b.GMOBJ,b.BMSUB,b.GMLDA,trim(b.GMDL01)')	
	})

	it('whereClause() should return valid businessLevel where partial', () => {
		var data = {
			buLevel: 'Comp',
			key: 'Hello World',
			accounts: 'acc',
			forYear: 2017
		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO = 'Hello' )) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		data.buLevel = 'BusU'
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU = ' Hello World' )) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
	})

	it('whereClause() should return valid adHoc where partial', () => {
		var data = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey',
			accounts: 'acc',
			forYear: 2017
		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		
		var oldCompanyKey = data.companyKey
		data.companyKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		
		data.companyKey = oldCompanyKey
		data.businessUnitKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey))) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
	})

	it('ytdAndMTDValues() should generate the appropriate string for month', () => {
		//console.log(generator.ytdAndMTDValues('13th'))
		expect(generator.ytdAndMTDValues('13th').YTD).to.be.equal('a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13')
		expect(generator.ytdAndMTDValues('13th').MTD).to.be.equal('a.GBAN13')

		expect(generator.ytdAndMTDValues('Sep').YTD).to.be.equal('a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12')
		expect(generator.ytdAndMTDValues('Sep').MTD).to.be.equal('a.GBAN12')

		expect(generator.ytdAndMTDValues('Aug').YTD).to.be.equal('a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11')
		expect(generator.ytdAndMTDValues('Aug').MTD).to.be.equal('a.GBAN11')

		expect(generator.ytdAndMTDValues('Jul').YTD).to.be.equal('a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10')
		expect(generator.ytdAndMTDValues('Jul').MTD).to.be.equal('a.GBAN10')

		expect(generator.ytdAndMTDValues('Oct').YTD).to.be.equal('a.GBAPYC+a.GBAN01')
		expect(generator.ytdAndMTDValues('Oct').MTD).to.be.equal('a.GBAN01')
	})

	it('select() should return a valid select statement', () => {
		expect(generator.select('Income Statement', '13th', 2017)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13-a.GBAPYC ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13-a.GBAPYC ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13-a.GBAPYC ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13-a.GBAPYC ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13-a.GBAPYC ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2018 THEN a.GBBORG ELSE 0 END)/100 as ProposedAnnualBud `)
		expect(generator.select('Something else', '13th', 2017)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2018 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)

		expect(generator.select('Income Statement', 'Oct', 2017)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2018 THEN a.GBBORG ELSE 0 END)/100 as ProposedAnnualBud `)
		expect(generator.select('Something else', 'Oct', 2017)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2018 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)
	})
	
	it('createSelectStatement() should genearate a valid select statement', () => {
		var options = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey'
		}

		expect(generator.createSelectStatement(true, 'Income Statement', 2016, 'Oct', 'acc', options)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2015 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2015 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBBORG ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as ProposedAnnualBud  FROM proddta.F0901 as b,proddta.F0902 as a  WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2015,2016,2017) OR a.GBFY IS NULL ))) GROUP BY a.GBCO,b.GMOBJ,b.BMSUB,b.GMLDA,trim(b.GMDL01) ORDER BY b.GMOBJ,b.GMSUB,b.GMLDA`)

	})
})

describe('SQL Generator individual function tests for Budrpt_f-90', () => {
	var Generator = require('./../lib/SQLGenerator')
	var generator = new Generator({type: 'f'})

	it('from() should return default from SQL partial', () => {
		expect(generator.from()).to.be.equal('FROM proddta.F0902 a,proddta.F0101 b,proddta.F0901 c ')
	})

	it('groupBy() should return static group by SQL partial', () => {
		expect(generator.groupBy()).to.be.equal(`GROUP BY (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END),(CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END), b.ABALPH,a.GBOBJ,trim(c.GMDL01)`)	
	})

	it('whereClause() should return valid businessLevel where partial', () => {
		var data = {
			buLevel: 'Comp',
			key: 'Hello World',
			accounts: 'acc',
			forYear: 2017,
			subledgers: 'sub'
		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBCO = 'Hello' )) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		data.buLevel = 'BusU'
		expect(generator.whereClause(data)).to.be.equal(`WHERE ((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBMCU = ' Hello World' )) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
	})

	it('whereClause() should return valid adHoc where partial', () => {
		var data = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey',
			accounts: 'acc',
			forYear: 2017,
			subledgers: 'sub'

		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBCO in (companyKey) OR a.GBMCU in (BUKey))) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		
		var oldCompanyKey = data.companyKey
		data.companyKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBMCU in (BUKey))) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		
		data.companyKey = oldCompanyKey
		data.businessUnitKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBCO in (companyKey))) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
	})

	it('ytdAndMTDValues() should generate the appropriate string for month', () => {
		//console.log(generator.ytdAndMTDValues('13th'))
		expect(generator.ytdAndMTDValues('13th').YTD).to.be.equal('a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13')
		expect(generator.ytdAndMTDValues('13th').MTD).to.be.equal('a.GBAN13')

		expect(generator.ytdAndMTDValues('Sep').YTD).to.be.equal('a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12')
		expect(generator.ytdAndMTDValues('Sep').MTD).to.be.equal('a.GBAN12')

		expect(generator.ytdAndMTDValues('Aug').YTD).to.be.equal('a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11')
		expect(generator.ytdAndMTDValues('Aug').MTD).to.be.equal('a.GBAN11')

		expect(generator.ytdAndMTDValues('Jul').YTD).to.be.equal('a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10')
		expect(generator.ytdAndMTDValues('Jul').MTD).to.be.equal('a.GBAN10')

		expect(generator.ytdAndMTDValues('Oct').YTD).to.be.equal('a.GBAPYC+a.GBAN01')
		expect(generator.ytdAndMTDValues('Oct').MTD).to.be.equal('a.GBAN01')
	})

	it('select() should return a valid select statement', () => {
		expect(generator.select('Income Statement', '13th', 2017)).to.be.equal(`SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END) as section, (CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13-a.GBAPYC ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13-a.GBAPYC ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13-a.GBAPYC ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13-a.GBAPYC ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13-a.GBAPYC ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2018 THEN a.GBBORG ELSE 0 END)/100 as ProposedAnnualBud `)
		expect(generator.select('Something else', '13th', 2017)).to.be.equal(`SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END) as section, (CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2018 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)

		expect(generator.select('Income Statement', 'Oct', 2017)).to.be.equal(`SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END) as section, (CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2018 THEN a.GBBORG ELSE 0 END)/100 as ProposedAnnualBud `)
		expect(generator.select('Something else', 'Oct', 2017)).to.be.equal(`SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END) as section, (CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2017 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2018 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)
	})
	
	it('createSelectStatement() should genearate a valid select statement', () => {
		var options = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey',
			subledgers: 'sub'
		}

		expect(generator.createSelectStatement(true, 'Income Statement', 2016, 'Oct', 'acc', options)).to.be.equal(`SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END) as section, (CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2015 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2015 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBBORG ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as ProposedAnnualBud  FROM proddta.F0902 a,proddta.F0101 b,proddta.F0901 c  WHERE ((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBCO in (companyKey) OR a.GBMCU in (BUKey))) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (2015,2016,2017) OR a.GBFY IS NULL ))) GROUP BY (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END),(CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END), b.ABALPH,a.GBOBJ,trim(c.GMDL01) ORDER BY 2,4`)

	})
})

describe('SQL Generator individual function tests for Budrpt_a-90', () => {
	var Generator = require('./../lib/SQLGenerator')
	var generator = new Generator({type: 'a'})

	it('whereClause() should return valid businessLevel where partial', () => {
		var data = {
			buLevel: 'Comp',
			key: 'Hello World',
			accounts: 'acc',
			forYear: 2017
		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO = 'Hello' )) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		data.buLevel = 'BusU'
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU = ' Hello World' )) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
	})

	it('whereClause() should return valid adHoc where partial', () => {
		var data = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey',
			accounts: 'acc',
			forYear: 2017

		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		
		var oldCompanyKey = data.companyKey
		data.companyKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		
		data.companyKey = oldCompanyKey
		data.businessUnitKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
	})
	
	it('createSelectStatement() should genearate a valid select statement', () => {
		var options = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey'
		}
		
		expect(generator.createSelectStatement(true, 'Income Statement', 2016, 'Oct', 'acc', options)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2015 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2015 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBBORG ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as ProposedAnnualBud  FROM proddta.F0901 as b,proddta.F0902 as a  WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2015,2016,2017) OR a.GBFY IS NULL ))) GROUP BY a.GBCO,b.GMOBJ,b.BMSUB,b.GMLDA,trim(b.GMDL01) ORDER BY b.GMOBJ,b.GMSUB,b.GMLDA`)
	})
})

describe('SQL Generator individual function tests for Budrpt_e-90', () => {
	var Generator = require('./../lib/SQLGenerator')
	var generator = new Generator({type: 'e'})

	it('whereClause() should return valid businessLevel where partial', () => {
		var data = {
			buLevel: 'Comp',
			key: 'Hello World',
			accounts: 'acc',
			forYear: 2017
		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO = 'Hello' )) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		data.buLevel = 'BusU'
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU = ' Hello World' )) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
	})

	it('whereClause() should return valid adHoc where partial', () => {
		var data = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey',
			accounts: 'acc',
			forYear: 2017

		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		
		var oldCompanyKey = data.companyKey
		data.companyKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
		
		data.companyKey = oldCompanyKey
		data.businessUnitKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2016,2017,2018) OR a.GBFY IS NULL )))`)
	})
	
	it('createSelectStatement() should genearate a valid select statement', () => {
		var options = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey'
		}
		
		expect(generator.createSelectStatement(true, 'Income Statement', 2016, 'Oct', 'acc', options)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2015 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2015 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBBORG ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01-a.GBAPYC ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 2016 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 2017 THEN a.GBBORG ELSE 0 END)/100 as ProposedAnnualBud  FROM proddta.F0901 as b,proddta.F0902 as a  WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (2015,2016,2017) OR a.GBFY IS NULL ))) GROUP BY a.GBCO,b.GMOBJ,b.BMSUB,b.GMLDA,trim(b.GMDL01) ORDER BY b.GMOBJ,b.GMSUB,b.GMLDA`)
	})
})