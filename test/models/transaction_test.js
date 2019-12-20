const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const Regime = require('../../app/models/regime')
const Transaction = require('../../app/models/transaction')
const { addTransaction, cleanTransactions } = require('../helpers/transaction_helper')

lab.experiment('Transaction model test', () => {
  lab.test('it searches using wildcards', async () => {
    await cleanTransactions()
    const regime = await Regime.find('wrls')
    const id = await addTransaction(regime, { licenceNumber: '123/ABC/33/*X/0123/Z44' })
    Code.expect(id).to.not.be.null()
    const id2 = await addTransaction(regime, { licenceNumber: '123/ABC/33/*Z/0123/Z44' })
    Code.expect(id2).to.not.be.null()

    const result = await Transaction.search({ line_attr_1: '123/ABC/33/%/0123/Z44' },
      1, 10, 'customer_reference', 'asc')
    Code.expect(result.pagination.recordCount).to.equal(2)
  })
})
