const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
// const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const { addBillRunTransaction, addBillRunDeminimisTransaction, cleanBillRuns, forceApproval } = require('../helpers/bill_run_helper')
const FileExportJob = require('../../app/jobs/file_export_job')
const CreateBillRun = require('../../app/services/create_bill_run')
const SendBillRun = require('../../app/services/send_bill_run')
const Schema = require('../../app/schema/pre_sroc')

describe('File export job', () => {
  let regime
  let schema

  before(async () => {
    regime = await Regime.find('wrls')
    schema = Schema[regime.slug]
  })

  beforeEach(async () => {
    await cleanBillRuns()
  })

  it('runs correctly when a valid bill run has been sent', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    const tId = await addBillRunTransaction(regime, billRun, { region: billRun.region })
    // HACK: set approved_for_billing on billrun and transactions
    await forceApproval(br.id, true)
    // reload billRun
    const reloadedBillRun = await (schema.BillRun).find(regime.id, billRun.id)

    await SendBillRun.call(regime, reloadedBillRun)
    await FileExportJob.run()

    const transaction = await (schema.Transaction).find(regime.id, tId)
    expect(transaction.isBilled).to.equal(true)
    expect(transaction.transaction_reference).to.not.equal(null)
    expect(transaction.transaction_date).to.not.equal(null)
  })

  it('doesn\'t assign transaction reference or date to zero value transaction', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    const tId = await addBillRunTransaction(regime, billRun, { region: billRun.region })
    const tIdZero = await addBillRunTransaction(regime, billRun, { region: billRun.region }, { chargeValue: 0 })
    // HACK: set approved_for_billing on billrun and transactions
    await forceApproval(br.id, true)
    // reload billRun
    const reloadedBillRun = await (schema.BillRun).find(regime.id, billRun.id)

    await SendBillRun.call(regime, reloadedBillRun)
    await FileExportJob.run()

    const transaction = await (schema.Transaction).find(regime.id, tId)
    expect(transaction.transaction_reference).to.not.equal(null)
    expect(transaction.transaction_date).to.not.equal(null)
    const zeroValueTransaction = await (schema.Transaction).find(regime.id, tIdZero)
    expect(zeroValueTransaction.transaction_reference).to.equal(null)
    expect(zeroValueTransaction.transaction_date).to.equal(null)
  })

  it('doesn\'t assign transaction reference or date to deminimis transaction', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    const tId = await addBillRunDeminimisTransaction(regime, billRun, { region: billRun.region })
    // HACK: set approved_for_billing on billrun and transactions
    await forceApproval(br.id, true)
    // reload billRun
    const reloadedBillRun = await (schema.BillRun).find(regime.id, billRun.id)

    await SendBillRun.call(regime, reloadedBillRun)
    await FileExportJob.run()

    const transaction = await (schema.Transaction).find(regime.id, tId)
    expect(transaction.transaction_reference).to.equal(null)
    expect(transaction.transaction_date).to.equal(null)
  })
})
