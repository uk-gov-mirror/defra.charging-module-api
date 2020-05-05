const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code
const Regime = require('../../app/models/regime')
const { addBillRunTransaction } = require('../helpers/bill_run_helper')
const CreateBillRun = require('../../app/services/create_bill_run')
const GenerateBillRunSummary = require('../../app/services/generate_bill_run_summary')

describe('Generate Bill Run Summary', () => {
  let regime
  let billRun

  before(async () => {
    regime = await Regime.find('wrls')
    const payload = {
      region: 'A'
    }
    const request = new (regime.schema.BillRunCreateRequest)(regime.id, payload)
    const result = await CreateBillRun.call(request)
    billRun = await regime.schema.BillRun.find(regime.id, result.id)
  })

  it('returns an error when bill run is empty', async () => {
    await expect(GenerateBillRunSummary.call(regime, billRun)).to.reject(Error, 'No records found for bill run')
  })

  it('returns a billrun summary', async () => {
    const tId = await addBillRunTransaction(regime, billRun, { region: 'A' })
    const transaction = await regime.schema.Transaction.find(regime.id, tId)
    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.billRunNumber).to.equal(br.bill_run_number)
    expect(summary.region).to.equal('A')
    expect(summary.approvedForBilling).to.be.false()
    expect(summary.summary.netTotal).to.equal(transaction.charge_value)
    expect(summary.customers[0].customerReference).to.equal(transaction.customerReference)
  })
})
