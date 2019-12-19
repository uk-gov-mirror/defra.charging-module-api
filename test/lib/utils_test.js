const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const { expect } = Code
const utils = require('../../app/lib/utils')

describe('Utils: validatePagination', () => {
  it('sets default values', async () => {
    const pg = utils.validatePagination(null, null)

    expect(pg).to.not.be.null()
    expect(pg.page).to.equal(1)
    expect(pg.perPage).to.equal(50)
  })

  it('forces values to be positive', () => {
    const pg = utils.validatePagination(-3, -2)
    expect(pg).to.not.be.null()
    expect(pg.page).to.equal(1)
    expect(pg.perPage).to.equal(50)
  })

  it('caps perPage to a maximum limit of 100', () => {
    const pg = utils.validatePagination(2, 2000)
    expect(pg).to.not.be.null()
    expect(pg.page).to.equal(2)
    expect(pg.perPage).to.equal(100)
  })
})

describe('Utils: validateFinancialYear', () => {
  it('reports an error when start and end dates are not in the same financial year', () => {
    const params = {
      periodStart: new Date(2020, 0, 1), // 1-JAN-2020
      periodEnd: new Date(2020, 5, 1) // 1-JUN-2020
    }
    const result = utils.validateFinancialYear(params)
    expect(result.error).to.exist()
  })

  it('is valid when start and end dates are in the same financial year', () => {
    const params = {
      periodStart: new Date(2020, 4, 1), // 1-MAY-2020
      periodEnd: new Date(2021, 0, 1) // 1-JAN-2021
    }
    const result = utils.validateFinancialYear(params)
    expect(result.error).to.not.exist()
  })
})
