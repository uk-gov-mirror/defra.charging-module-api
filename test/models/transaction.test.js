const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code
const Regime = require('../../app/models/regime')
const Transaction = require('../../app/models/transaction')
const { addTransaction, cleanTransactions } = require('../helpers/transaction_helper')

describe('Transaction model', () => {
  before(async () => {
    await cleanTransactions()
  })

  it('searches using wildcards', async () => {
    const regime = await Regime.find('wrls')

    const id = await addTransaction(regime, { licenceNumber: '123/ABC/33/*X/0123/Z44' })
    expect(id).to.not.be.null()
    const id2 = await addTransaction(regime, { licenceNumber: '123/ABC/33/*Z/0123/Z44' })
    expect(id2).to.not.be.null()

    const searchRequest = new (regime.schema.TransactionSearchRequest)(regime.id, { licenceNumber: '123/ABC/33/%/0123/Z44' })
    // const result = await Transaction.search({ line_attr_1: '123/ABC/33/%/0123/Z44' },
    //   1, 10, 'customer_reference', 'asc')
    const result = await Transaction.search(searchRequest)
    expect(result.pagination.recordCount).to.equal(2)
  })
})
