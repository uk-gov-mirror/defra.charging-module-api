const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
// const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const { addBillRunTransaction, cleanBillRuns, forceApproval } = require('../helpers/bill_run_helper')
const CreateBillRun = require('../../app/services/create_bill_run')
const SendBillRun = require('../../app/services/send_bill_run')
const Schema = require('../../app/schema/pre_sroc')

describe('Send bill run', () => {
  let regime
  let schema

  before(async () => {
    regime = await Regime.find('wrls')
    schema = Schema[regime.slug]
  })

  beforeEach(async () => {
    await cleanBillRuns()
  })

  it('sends a bill run', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    await addBillRunTransaction(regime, billRun, { region: billRun.region })
    // HACK: set approved_for_billing on billrun and transactions
    await forceApproval(br.id, true)
    // reload billRun
    const reloadedBillRun = await (schema.BillRun).find(regime.id, billRun.id)

    const sentBillRun = await SendBillRun.call(regime, reloadedBillRun)

    expect(sentBillRun.invoice_count).to.equal(1)
    expect(sentBillRun.status).to.equal('pending')
  })

  it('requires a bill run to include a transaction', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    // HACK: set approved_for_billing on billrun and transactions
    await forceApproval(br.id, true)
    // reload billRun
    const reloadedBillRun = await (schema.BillRun).find(regime.id, billRun.id)

    await expect(SendBillRun.call(regime, reloadedBillRun)).to.reject(Error, 'No records found for bill run')
  })
})
