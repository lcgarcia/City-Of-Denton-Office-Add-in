var chai = require('chai')
var expect = chai.expect
// We may need fuzzy later so I included it as a dev dependancy just incase
//chai.use(require('chai-fuzzy'))

describe('JobCostSQLGenerator', () => {
  var Generator = require('./../lib/JobCostSQLGenerator')

  describe('Jobcost 90', () => {
    var generator = new Generator({ type: '' });
    var type = '';
    
    it('select should be valid', () => {
      expect(generator.select(type, 'Sep', 2017, 'Cost Code/Type Details')).to.be.equal("SELECT b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01 as BusUnit,a.GBOBJ as Object,a.GBSUB as Sub, SUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 as Budget, SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12  ELSE 0 END)/100 as Act, SUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 - SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 as Remaining, SUM(CASE WHEN a.GBLT = 'PA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12  ELSE 0 END)/100 as Encumbrance, SUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 - SUM(CASE WHEN a.GBOBJ between '1340' and '1370' and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 as Unencumbered ");
    });

    it('from should be static valid', () => {
      expect(generator.from()).to.be.equal('FROM proddta.F0902 a,proddta.F0006 b ');
    });

    it('where should be valid', () => {
      const options = {
        department: '*ALL',
        company: '*ALL',
        project: '*ALL',
        job: '*ALL',
        layout: 'Cost Code/Type Details'
      };
      expect(generator.where(type, 2017, options)).to.be.equal("WHERE a.gbmcu = b.mcmcu AND a.GBLT in ('AA','PA','JA') AND b.mcstyl = 'JB' AND b.MCRP27 <> '60'  AND a.GBCO <> '*ALL'  AND b.MCMCUS <> '*ALL'  AND a.GBMCU <> '*ALL'  AND a.GBFY = 17 ");
    });

    it('groupBy should be valid', () => {
      expect(generator.groupBy(type, 'Cost Code/Type Details')).to.be.equal("GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01,a.GBOBJ,a.GBSUB ");
    });

    it('orderBy should be valid', () => {
      expect(generator.orderBy(type, 'Cost Code/Type Details')).to.be.equal('ORDER BY 3,4,1,2 ');
    });
  });

  describe('Jobcost 90 e', () => {
    var generator = new Generator({ type: 'e' });
    var type = 'e';
    
    it('select should be valid', () => {
      expect(generator.select(type, 'Sep', 2017, 'Cost Code/Type Details')).to.be.equal("SELECT undefinedSUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 as Budget, SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12  ELSE 0 END)/100 as Act, SUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 - SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 as Remaining, SUM(CASE WHEN a.GBLT = 'PA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12  ELSE 0 END)/100 as Encumbrance, SUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 - SUM(CASE WHEN a.GBOBJ between '1340' and '1370' and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 as Unencumbered ");
    });

    it('from should be static valid', () => {
      expect(generator.from()).to.be.equal('FROM proddta.F0902 a,proddta.F0006 b ');
    });

    it('where should be valid', () => {
      const options = {
        department: '*ALL',
        company: '*ALL',
        project: '*ALL',
        job: '*ALL',
        layout: 'Cost Code/Type Details'
      };
      expect(generator.where(type, 2017, options)).to.be.equal("WHERE a.gbmcu = b.mcmcu AND a.GBLT in ('AA','PA','JA') AND b.mcstyl = 'JB' AND b.MCRP27 <> '60'  AND a.GBCO <> '*ALL'  AND b.MCMCUS <> '*ALL'  AND a.GBMCU <> '*ALL'  AND a.GBFY = 17 ");
    });

    it('groupBy should be valid', () => {
      expect(generator.groupBy(type, 'Cost Code/Type Details')).to.be.equal("GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01,a.GBOBJ,a.GBSUB ");
    });

    it('orderBy should be valid', () => {
      expect(generator.orderBy(type, 'Cost Code/Type Details')).to.be.equal('ORDER BY 3,4,1,2 ');
    });
  });

  describe('Jobcost 90 ka', () => {
    var generator = new Generator({ type: 'ka' });
    var type = 'ka';
    
    it('select should be valid', () => {
      expect(generator.select(type, 'Sep', 2017, 'Cost Code/Type Details')).to.be.equal("SELECT undefinedSUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 as Budget, SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12  ELSE 0 END)/100 as Act, SUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 - SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 as Remaining, SUM(CASE WHEN a.GBLT = 'PA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12  ELSE 0 END)/100 as Encumbrance, SUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 - SUM(CASE WHEN a.GBOBJ between '1340' and '1370' and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 as Unencumbered ");
    });

    it('from should be static valid', () => {
      expect(generator.from()).to.be.equal('FROM proddta.F0902 a,proddta.F0006 b ');
    });

    it('where should be valid', () => {
      const options = {
        department: '*ALL',
        company: '*ALL',
        project: '*ALL',
        job: '*ALL',
        layout: 'Cost Code/Type Details',
        catCode: '*ALL',
        catCode1: '*ALL',
        catField: '*ALL',
        catField1: '*ALL',
      };
      expect(generator.where(type, 2017, options)).to.be.equal("WHERE a.gbmcu = b.mcmcu AND a.GBLT in ('AA','PA','JA') AND b.mcstyl = 'JB' AND b.MCRP27 <> '60'  AND a.GBCO <> '*ALL'  AND b.MCMCUS <> '*ALL'  AND a.GBMCU <> '*ALL'  AND a.GBFY = 17  AND b.MCRP01<>'*ALL' AND b.MCRP01<>'*ALL' ");
    });

    it('groupBy should be valid', () => {
      expect(generator.groupBy(type, 'Cost Code/Type Details')).to.be.equal("GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01,a.GBOBJ,a.GBSUB ");
    });

    it('orderBy should be valid', () => {
      expect(generator.orderBy(type, 'Cost Code/Type Details')).to.be.equal('ORDER BY 3,4,1,2 ');
    });
  });

  describe('Jobcost 90 new', () => {
    var generator = new Generator({ type: 'new' });
    var type = 'new';
    
    it('select should be valid', () => {
      expect(generator.select(type, 'Sep', 2017, 'Cost Code/Type Details')).to.be.equal("SELECT undefinedSUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 as Budget, SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12  ELSE 0 END)/100 as Act, SUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 - SUM(CASE WHEN a.GBOBJ between '1340' and '1370'  and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 as Remaining, SUM(CASE WHEN a.GBLT = 'PA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12  ELSE 0 END)/100 as Encumbrance, SUM(CASE WHEN a.GBLT = 'JA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12+a.GBBORG ELSE 0 END)/100 - SUM(CASE WHEN a.GBOBJ between '1340' and '1370' and a.GBLT = 'AA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 - SUM(CASE WHEN a.GBLT = 'PA' THEN a.GBAPYC+a.GBAN01+a.GBAN02+a.GBAN03+a.GBAN04+a.GBAN05+a.GBAN06+a.GBAN07+a.GBAN08+a.GBAN09+a.GBAN10+a.GBAN11+a.GBAN12 ELSE 0 END)/100 as Unencumbered ");
    });

    it('from should be static valid', () => {
      expect(generator.from()).to.be.equal('FROM proddta.F0902 a,proddta.F0006 b ');
    });

    it('where should be valid', () => {
      const options = {
        department: '*ALL',
        company: '*ALL',
        project: '*ALL',
        job: '*ALL',
        layout: 'Cost Code/Type Details',
        catCode: '*ALL',
        catCode1: '*ALL',
        catField: '*ALL',
        catField1: '*ALL',
      };
      expect(generator.where(type, 2017, options)).to.be.equal("WHERE a.gbmcu = b.mcmcu AND a.GBLT in ('AA','PA','JA') AND b.mcstyl = 'JB' AND b.MCRP27 <> '60'  AND a.GBCO <> '*ALL'  AND b.MCMCUS <> '*ALL'  AND a.GBMCU <> '*ALL'  AND a.GBFY = 17  AND b.MCRP01<>'*ALL' AND b.MCRP01<>'*ALL' ");
    });

    it('groupBy should be valid', () => {
      expect(generator.groupBy(type, 'Cost Code/Type Details')).to.be.equal("GROUP BY b.MCRP27,a.GBCO,b.MCMCUS,a.GBMCU || ' ' || b.MCDL01,a.GBOBJ,a.GBSUB ");
    });

    it('orderBy should be valid', () => {
      expect(generator.orderBy(type, 'Cost Code/Type Details')).to.be.equal('ORDER BY 3,4,1,2 ');
    });
  });
});