var chai = require('chai')
var expect = chai.expect
// We may need fuzzy later so I included it as a dev dependancy just incase
//chai.use(require('chai-fuzzy'))

describe('Budget SQL Generator individual function tests for Budrpt-90', () => {
	var Generator = require('./../lib/BudgetSQLGenerator')
	var generator = new Generator()

	it('from() should return default from SQL partial', () => {
		expect(generator.from()).to.be.equal('FROM proddta.F0901 b,proddta.F0902 a ')
	})

	it('groupBy() should return static group by SQL partial', () => {
		expect(generator.groupBy()).to.be.equal('GROUP BY a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01)')	
	})

	it('whereClause() should return valid businessLevel where partial', () => {
		var data = {
			buLevel: 'Comp',
			key: 'Hello World',
			accounts: 'acc',
			forYear: 2017
		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO = 'Hello World' )) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
		data.buLevel = 'BusU'
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU = ' Hello World' )) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
	})

	it('whereClause() should return valid adHoc where partial', () => {
		var data = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey',
			accounts: 'acc',
			forYear: 2017
		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
		
		var oldCompanyKey = data.companyKey
		data.companyKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
		
		data.companyKey = oldCompanyKey
		data.businessUnitKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey))) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
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
		expect(generator.select('Income Statement', '13th', 2017)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 18 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `);
		expect(generator.select('Something else', '13th', 2017)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 18 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)

		expect(generator.select('Income Statement', 'Oct', 2017)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 18 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)
		expect(generator.select('Something else', 'Oct', 2017)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 18 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)
	})
	
	it('createSelectStatement() should genearate a valid select statement', () => {
		var options = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey'
		}

		expect(generator.createSelectStatement(true, 'Income Statement', 2016, 'Oct', 'acc', options)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 15 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 15 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud  FROM proddta.F0901 b,proddta.F0902 a  WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (15,16,17) OR a.GBFY IS NULL ))) GROUP BY a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) ORDER BY b.GMOBJ,b.GMSUB,b.GMLDA`)

	})

	it('createSelectStatement() test query', () => {
		var options = {
			buLevel: 'Comp',
			key: '00105'
		}
		//console.log(generator.getBusinessUnitData());
		//console.log(generator.createSelectStatement(false, 'Income Statement', 2015, 'Feb', "between '4000' and '9999'", options));
	});
})

describe('SQL Generator individual function tests for Budrpt_f-90', () => {
  var Generator = require('./../lib/BudgetSQLGenerator')
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
    expect(generator.whereClause(data)).to.be.equal(`WHERE (((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBCO = 'Hello World' )) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
    data.buLevel = 'BusU'
    expect(generator.whereClause(data)).to.be.equal(`WHERE (((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBMCU = ' Hello World' )) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
  })

  it('whereClause() should return valid adHoc where partial', () => {
    var data = {
      companyKey: 'companyKey',
      businessUnitKey: 'BUKey',
      accounts: 'acc',
      forYear: 2017,
      subledgers: 'sub'

    }
    expect(generator.whereClause(data)).to.be.equal(`WHERE (((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBCO in (companyKey) OR a.GBMCU in (BUKey))) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
    
    var oldCompanyKey = data.companyKey
    data.companyKey = ''
    expect(generator.whereClause(data)).to.be.equal(`WHERE (((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBMCU in (BUKey))) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
    
    data.companyKey = oldCompanyKey
    data.businessUnitKey = ''
    expect(generator.whereClause(data)).to.be.equal(`WHERE (((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBCO in (companyKey))) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
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
    expect(generator.select('Income Statement', '13th', 2017)).to.be.equal(`SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END) as section, (CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 18 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)
    expect(generator.select('Something else', '13th', 2017)).to.be.equal(`SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END) as section, (CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN13 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 18 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)

    expect(generator.select('Income Statement', 'Oct', 2017)).to.be.equal(`SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END) as section, (CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 18 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)
    expect(generator.select('Something else', 'Oct', 2017)).to.be.equal(`SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END) as section, (CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 17 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 18 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud `)
  })
  
  it('createSelectStatement() should genearate a valid select statement', () => {
    var options = {
      companyKey: 'companyKey',
      businessUnitKey: 'BUKey',
      subledgers: 'sub'
    }

    expect(generator.createSelectStatement(true, 'Income Statement', 2016, 'Oct', 'acc', options)).to.be.equal(`SELECT (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END) as section, (CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END) as GBSBL, b.ABALPH,a.GBOBJ,trim(c.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 15 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 15 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud  FROM proddta.F0902 a,proddta.F0101 b,proddta.F0901 c  WHERE (((a.GBAID = c.GMAID)) AND ((to_number(decode(a.GBSBL,'        ','0',substr(a.GBSBL,5))) = b.aban8(+))) AND ((a.GBOBJ acc)) AND ((a.GBCO in (companyKey) OR a.GBMCU in (BUKey))) AND ((a.GBSBL sub)) AND ((a.GBLT in ('AA','PA','BA') OR a.GBLT IS NULL )) AND ((a.GBFY in (15,16,17) OR a.GBFY IS NULL ))) GROUP BY (CASE WHEN a.GBSBL between '00004000' and '00004999' THEN '1REVENUE' ELSE '2EXPENDITURES' END),(CASE WHEN trim(a.GBSBL) = '' Or trim(a.gbsbl) is null THEN 'BLANK SUBLEDGER' ELSE a.GBSBL END), b.ABALPH,a.GBOBJ,trim(c.GMDL01) ORDER BY 2,4`)

  })

  it('createSelectStatement() test query', () => {
		var options = {
			buLevel: 'Comp', 
			key: '00600',
      subledgers: "in ('        ','     460','     580','     583','     588','     830','    5600','    5800','    5820','    5830','    5840','    5850','    5860','    5880','    5940','  000093','  600001','  600110','  600200','  600300','  600400','  600500','  600600','  600800','  600900','  630450','  640001','  840100','00000417','00000440','00000460','00000480','00000540','00000560','00000562','00000580','00000583','00000584','00000586','00000588','00000599','00000620','00000830','00000910','00000920','00000930','00002210','00003110','00003120','00003140','00003160','00003500','00003520','00003530','00003540','00003550','00003560','00003570','00003580','00003600','00003610','00003620','00003630','00003640','00003641','00003650','00003651','00003660','00003661','00003669','00003670','00003671','00003680','00003681','00003690','00003691','00003700','00003710','00003720','00003730','00003731','00003820','00003830','00003890','00003900','00003910','00003920','00003930','00003940','00003950','00003960','00003970','00003980','00004030','00004080','00004150','00004170','00004171','00004172','00004173','00004174','00004175','00004190','00004210','00004260','00004270','00004312','00004360','00004400','00004420','00004440','00004450','00004490','00004510','00004560','00005000','00005010','00005020','00005050','00005060','00005061','00005068','00005069','00005100','00005110','00005120','00005130','00005140','00005350','00005360','00005380','00005390','00005400','00005440','00005450','00005460','00005550','00005555','00005600','00005610','00005615','00005620','00005630','00005650','00005660','00005670','00005680','00005690','00005700','00005730','00005750','00005800','00005808','00005810','00005820','00005830','00005840','00005850','00005860','00005870','00005880','00005881','00005882','00005886','00005887','00005890','00005900','00005910','00005920','00005930','00005940','00005950','00005960','00005968','00005970','00005980','00009020','00009030','00009040','00009060','00009080','00009120','00009130','00009160','00009200','00009201','00009202','00009205','00009210','00009218','00009230','00009240','00009260','000093  ','00009300','00009330','00009350','00014014','00014015','00014021','00092000','00213495','00392104','00392411','00457537','00493221','00514562','00537182','00685011') "
		}
		//console.log(generator.getBusinessUnitData());
		//console.log(generator.createSelectStatement(false, 'Income Statement', 2015, 'Feb', "between '4000' and '9999'", options));

	});
})

describe('SQL Generator individual function tests for Budrpt_a-90', () => {
	var Generator = require('./../lib/BudgetSQLGenerator')
	var generator = new Generator({type: 'a'})

	it('whereClause() should return valid businessLevel where partial', () => {
		var data = {
			buLevel: 'Comp',
			key: 'Hello World',
			accounts: 'acc',
			forYear: 2017
		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO = 'Hello World' )) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
		data.buLevel = 'BusU'
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU = ' Hello World' )) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
	})

	it('whereClause() should return valid adHoc where partial', () => {
		var data = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey',
			accounts: 'acc',
			forYear: 2017

		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
		
		var oldCompanyKey = data.companyKey
		data.companyKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
		
		data.companyKey = oldCompanyKey
		data.businessUnitKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
	})
	
	it('createSelectStatement() should genearate a valid select statement', () => {
		var options = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey'
		}
		
		expect(generator.createSelectStatement(true, 'Income Statement', 2016, 'Oct', 'acc', options)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 15 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 15 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud  FROM proddta.F0901 b,proddta.F0902 a  WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (15,16,17) OR a.GBFY IS NULL ))) GROUP BY a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) ORDER BY b.GMOBJ,b.GMSUB,b.GMLDA`)
	})

	it('createSelectStatement() test query', () => {
		var options = {
			buLevel: 'Comp', 
			key: '00100'
		}

		//console.log(generator.createSelectStatement(false, 'Income Statement', 2015, 'Feb', "between '4000' and '9999'", options));

	})
})

describe('SQL Generator individual function tests for Budrpt_e-90', () => {
	var Generator = require('./../lib/BudgetSQLGenerator')
	var generator = new Generator({type: 'e'})

	it('whereClause() should return valid businessLevel where partial', () => {
		var data = {
			buLevel: 'Comp',
			key: 'Hello World',
			accounts: 'acc',
			forYear: 2017
		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO = 'Hello World' )) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
		data.buLevel = 'BusU'
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU = ' Hello World' )) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
	})

	it('whereClause() should return valid adHoc where partial', () => {
		var data = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey',
			accounts: 'acc',
			forYear: 2017

		}
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
		
		var oldCompanyKey = data.companyKey
		data.companyKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
		
		data.companyKey = oldCompanyKey
		data.businessUnitKey = ''
		expect(generator.whereClause(data)).to.be.equal(`WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (16,17,18) OR a.GBFY IS NULL )))`)
	})
	
	it('createSelectStatement() should genearate a valid select statement', () => {
		var options = {
			companyKey: 'companyKey',
			businessUnitKey: 'BUKey'
		}
		
		expect(generator.createSelectStatement(true, 'Income Statement', 2016, 'Oct', 'acc', options)).to.be.equal(`SELECT a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) as GMDL01,SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 15 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as PriorAnnualAct, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 15 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as PriorYTDAct, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as CurrentOrigBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBBORG ELSE 0 END)/100 as CurrentModBud, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentAvailBal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 +SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAPYC+a.GBAN01 ELSE 0 END)/100 as CurrentYTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDBud, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDEnc, SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDAct, SUM(CASE WHEN a.GBLT = 'PA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 + SUM(CASE WHEN a.GBLT = 'AA' and a.GBFY = 16 THEN a.GBAN01 ELSE 0 END)/100 as CurrentPTDTotal, SUM(CASE WHEN a.GBLT = 'BA' and a.GBFY = 17 THEN a.GBAPYC+ a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBAN13 ELSE 0 END)/100 as ProposedAnnualBud  FROM proddta.F0901 b,proddta.F0902 a  WHERE ( (b.GMAID = a.GBAID(+)) AND ((b.GMOBJ acc)) AND ((b.GMCO in (companyKey) OR b.GMMCU in (BUKey))) AND ((a.GBLT in ('AA','PA','BA','B3') OR a.GBLT IS NULL )) AND ((a.GBFY in (15,16,17) OR a.GBFY IS NULL ))) GROUP BY a.GBCO,b.GMOBJ,b.GMSUB,b.GMLDA,trim(b.GMDL01) ORDER BY b.GMOBJ,b.GMSUB,b.GMLDA`)
	})

	it('createSelectStatement() test query', () => {
		var options = {
			buLevel: 'Comp', 
			key: '00100'
		}

		//console.log(generator.getBusinessUnitData());
		//console.log(generator.createSelectStatement(false, 'Income Statement', 2015, 'Feb', "between '4000' and '9999'", options));

	})
})