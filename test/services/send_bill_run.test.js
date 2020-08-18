const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
// const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const { addTransctionsAndApprove, cleanBillRuns, forceApproval } = require('../helpers/bill_run_helper')
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
    const { billRun } = await addTransctionsAndApprove(br, regime, schema, [50])

    const sentBillRun = await SendBillRun.call(regime, billRun)

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

  it('handles case where a bill run group only contains zero value transactions', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun } = await addTransctionsAndApprove(br, regime, schema, [0])
    const sentBillRun = await SendBillRun.call(regime, billRun)

    expect(sentBillRun.invoice_count).to.equal(0)
  })

  it('does not allocate a file reference to zero value-only bill runs', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun } = await addTransctionsAndApprove(br, regime, schema, [50])
    const sentBillRun = await SendBillRun.call(regime, billRun)

    const zbr = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun: zeroBillRun } = await addTransctionsAndApprove(zbr, regime, schema, [0])
    const zeroSentBillRun = await SendBillRun.call(regime, zeroBillRun)

    const cbr = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun: consecutiveBillRun } = await addTransctionsAndApprove(cbr, regime, schema, [50])
    const consecutiveSentBillRun = await SendBillRun.call(regime, consecutiveBillRun)

    expect(consecutiveSentBillRun.fileId - sentBillRun.fileId).to.equal(1)
    expect(zeroSentBillRun.fileId).to.equal(null)
  })
})
