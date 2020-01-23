const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code
// const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const { addTransaction, cleanTransactions } = require('../helpers/transaction_helper')
const { billRunCount } = require('../helpers/bill_run_helper')
const BillRun = require('../../app/models/bill_run')
const Transaction = require('../../app/models/transaction')
const GenerateBillRun = require('../../app/services/generate_bill_run')
const Schema = require('../../app/schema/pre_sroc')

describe('Generate Bill Run: draft', () => {
  let regime
  let billRun

  before(async () => {
    regime = await Regime.find('wrls')
    const schema = Schema[regime.slug]
    const payload = {
      region: 'A',
      draft: true
    }
    // create a BillRun object, validate and translate
    billRun = await schema.BillRun.instanceFromRequest(regime.id, payload)
    await cleanTransactions()
  })

  it('returns a billrun summary', async () => {
    await addTransaction(regime)

    const summary = await GenerateBillRun.call(billRun)

    expect(summary.bill_run_reference).to.exist()
    expect(summary.draft).to.be.true()
    expect(summary.region).to.equal('A')
    expect(summary.summaries).to.exist()
  })

  it('does not create a BillRun record', async () => {
    await addTransaction(regime)

    const countBefore = await billRunCount()
    const summary = await GenerateBillRun.call(billRun)
    const countAfter = await billRunCount()

    expect(summary).to.not.be.null()
    expect(countBefore).to.equal(countAfter)
  })
})

describe('Generate Bill Run: Non-draft', async () => {
  let regime
  let billRun

  before(async () => {
    regime = await Regime.find('wrls')
    const schema = Schema[regime.slug]
    const payload = {
      region: 'A',
      draft: false
    }
    // create a BillRun object, validate and translate
    billRun = await schema.BillRun.instanceFromRequest(regime.id, payload)
    await cleanTransactions()
  })

  it('returns billrun summary', async () => {
    await addTransaction(regime)

    const summary = await GenerateBillRun.call(billRun)

    expect(summary.billRunId).to.exist()
    expect(summary.draft).to.be.false()
    expect(summary.region).to.equal('A')
    expect(summary.summaries).to.exist()
    expect(summary.id).to.exist()
  })

  it('creates a bill run record', async () => {
    await addTransaction(regime)
    const countBefore = await billRunCount()
    const summary = await GenerateBillRun.call(billRun)
    const countAfter = await billRunCount()
    const result = await BillRun.find(null, regime.id, summary.id)
    expect(result).to.not.be.null()
    expect(countAfter).to.equal(countBefore + 1)
  })

  it('creates an association between the transaction and bill run records', async () => {
    const id = await addTransaction(regime)

    const summary = await GenerateBillRun.call(billRun)

    const transaction = await Transaction.find(regime.id, id)
    expect(transaction.bill_run_id).to.equal(summary.id)
  })
})
