const chai = require('chai')
const expect = chai.expect
const dataFormater = require('../lib/DataFormater')

describe('Data Formater', () => {
  describe('formatBusinessUnit should', () => {
    it('rename MCMCU to id and MCDL01 to name', () => {
      const testData = [
        {MCCO: 'xxx', CCNAME: 'Blah', MCMCU: 1, MCDL01: 'Name1'},
        {MCCO: 'yyy', CCNAME: 'Blah', MCMCU: 2, MCDL01: 'Name2'},
        {MCCO: 'zzz', CCNAME: 'Blah', MCMCU: 2, MCDL01: 'Name2'},
      ]
      expect(dataFormater.formatBusinessUnit(testData)[0]).to.deep.equal({MCCO: 'xxx', CCNAME: 'Blah', id: 1, name: 'Name1', childList: []});
    })

    it('shold group by MCCO', () => {
      const testData = [
        {MCCO: 'xxx', CCNAME: 'Blah', MCMCU: 1, MCDL01: 'Name1'},
        {MCCO: 'xxx', CCNAME: 'Blah', MCMCU: 1.2, MCDL01: 'Name1.2'},
        {MCCO: 'xxx', CCNAME: 'Blah', MCMCU: 1.3, MCDL01: 'Name1.3'},
        {MCCO: 'yyy', CCNAME: 'Blah', MCMCU: 2, MCDL01: 'Name2'},
        {MCCO: 'zzz', CCNAME: 'Blah', MCMCU: 2, MCDL01: 'Name2'},
      ]
      expect(dataFormater.formatBusinessUnit(testData)[0].childList).to.deep.equal([{MCCO: 'xxx', CCNAME: 'Blah', id: 1.2, name: 'Name1.2'},{MCCO: 'xxx', CCNAME: 'Blah', id: 1.3, name: 'Name1.3'}]);
    })
  })  
})