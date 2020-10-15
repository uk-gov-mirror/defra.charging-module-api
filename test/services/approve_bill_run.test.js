const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
const Regime = require('../../app/models/regime')
const { addBillRunTransaction, cleanBillRuns, forceStatus } = require('../helpers/bill_run_helper')
const CreateBillRun = require('../../app/services/create_bill_run')
const ApproveBillRun = require('../../app/services/approve_bill_run')
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

  it('sets the approval flag on the bill run', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    expect(billRun.approved_for_billing).to.be.false()

    await addBillRunTransaction(regime, billRun, { region: billRun.region })

    const upd = await ApproveBillRun.call(regime, billRun.id)
    expect(upd.billRun).to.equal(1)
    expect(upd.transactions).to.equal(1)
    // reload billRun
    const billRun2 = await (schema.BillRun).find(regime.id, billRun.id)
    expect(billRun2.approved_for_billing).to.be.true()
  })

  it('sets the approval flag on the transactions in the bill run', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    expect(billRun.approved_for_billing).to.be.false()

    const tId = await addBillRunTransaction(regime, billRun, { region: billRun.region })

    const upd = await ApproveBillRun.call(regime, billRun.id)
    expect(upd.billRun).to.equal(1)
    expect(upd.transactions).to.equal(1)

    const transaction = await (schema.Transaction).find(regime.id, tId)
    expect(transaction.approved_for_billing).to.be.true()
  })

  it('throws an error if the bill run has already been billed', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A', status: 'billed' })
    await forceStatus(br.id, 'billed') // HACK
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    expect(billRun.status).to.equal('billed')

    await expect(ApproveBillRun.call(regime, billRun.id)).to.reject(Error, 'Cannot approve Bill Run because it has been billed')
  })
})
