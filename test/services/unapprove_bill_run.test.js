const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
const Regime = require('../../app/models/regime')
const { addBillRunTransaction, cleanBillRuns, forceStatus, forceApproval } = require('../helpers/bill_run_helper')
const CreateBillRun = require('../../app/services/create_bill_run')
const UnapproveBillRun = require('../../app/services/unapprove_bill_run')
const Schema = require('../../app/schema/pre_sroc')

describe('Approve bill run', () => {
  let regime
  let schema

  before(async () => {
    regime = await Regime.find('wrls')
    schema = Schema[regime.slug]
  })

  beforeEach(async () => {
    await cleanBillRuns()
  })

  it('clears the approval flag on the bill run', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    expect(billRun.approved_for_billing).to.be.false()
    await addBillRunTransaction(regime, billRun, { region: billRun.region })

    // HACK: set approved_for_billing on billrun and transactions
    const apr = await forceApproval(br.id, true)
    expect(apr.billRun).to.equal(1)
    expect(apr.transactions).to.equal(1)

    const upd = await UnapproveBillRun.call(regime, billRun.id)
    expect(upd.billRun).to.equal(1)
    expect(upd.transactions).to.equal(1)
    // reload billRun
    const billRun2 = await (schema.BillRun).find(regime.id, billRun.id)
    expect(billRun2.approved_for_billing).to.be.false()
  })

  it('clears the approval flag on the transactions in the bill run', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    expect(billRun.approved_for_billing).to.be.false()
    const tId = await addBillRunTransaction(regime, billRun, { region: billRun.region })

    // HACK: set approved_for_billing on billrun and transactions
    const apr = await forceApproval(br.id, true)
    expect(apr.billRun).to.equal(1)
    expect(apr.transactions).to.equal(1)

    const upd = await UnapproveBillRun.call(regime, billRun.id)
    expect(upd.billRun).to.equal(1)
    expect(upd.transactions).to.equal(1)

    const transaction = await (schema.Transaction).find(regime.id, tId)
    expect(transaction.approved_for_billing).to.be.false()
  })

  it('throws an error if the bill run has already been billed', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    await forceStatus(br.id, 'billed') // HACK
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    expect(billRun.status).to.equal('billed')

    await expect(UnapproveBillRun.call(regime, billRun.id)).to.reject(Error, 'Cannot unapprove BillRun because it has been billed')
  })
})
