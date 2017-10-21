const chai = require('chai')
const expect = chai.expect
const dataFormater = require('../lib/DataFormater')

describe('Data Formater', () => {
  describe('formatBusinessUnit should', () => {
    it('rename mcmcu to id and mcdl01 to name', () => {
      const testData = [
        {mcco: 'xxx', ccname: 'Blah', mcmcu: 1, mcdl01: 'Name1'},
        {mcco: 'yyy', ccname: 'Blah', mcmcu: 2, mcdl01: 'Name2'},
        {mcco: 'zzz', ccname: 'Blah', mcmcu: 2, mcdl01: 'Name2'},
      ]
      expect(dataFormater.formatBusinessUnit(testData)[0]).to.deep.equal({mcco: 'xxx', ccname: 'Blah', id: 1, name: 'Name1', childList: []});
    })

    it('shold group by mcco', () => {
      const testData = [
        {mcco: 'xxx', ccname: 'Blah', mcmcu: 1, mcdl01: 'Name1'},
        {mcco: 'xxx', ccname: 'Blah', mcmcu: 1.2, mcdl01: 'Name1.2'},
        {mcco: 'xxx', ccname: 'Blah', mcmcu: 1.3, mcdl01: 'Name1.3'},
        {mcco: 'yyy', ccname: 'Blah', mcmcu: 2, mcdl01: 'Name2'},
        {mcco: 'zzz', ccname: 'Blah', mcmcu: 2, mcdl01: 'Name2'},
      ]
      expect(dataFormater.formatBusinessUnit(testData)[0].childList).to.deep.equal([{mcco: 'xxx', ccname: 'Blah', id: 1.2, name: 'Name1.2'},{mcco: 'xxx', ccname: 'Blah', id: 1.3, name: 'Name1.3'}]);
    })
  })  
})