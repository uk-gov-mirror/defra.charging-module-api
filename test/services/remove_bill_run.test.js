const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
// const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const { addBillRunTransaction, cleanBillRuns, forceStatus } = require('../helpers/bill_run_helper')
const CreateBillRun = require('../../app/services/create_bill_run')
const RemoveBillRun = require('../../app/services/remove_bill_run')
const Schema = require('../../app/schema/pre_sroc')

describe('Remove bill run', () => {
  let regime
  let schema

  before(async () => {
    regime = await Regime.find('wrls')
    schema = Schema[regime.slug]
  })

  beforeEach(async () => {
    await cleanBillRuns()
  })

  it('removes the bill run and nested transactions', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    const tId = await addBillRunTransaction(regime, billRun, { region: billRun.region })

    const count = await RemoveBillRun.call(regime, billRun.id)
    expect(count).to.equal(1)
    // reload billRun
    const billRun2 = await (schema.BillRun).find(regime.id, billRun.id)
    expect(billRun2).to.be.null()

    const transaction = await (schema.Transaction).find(regime.id, tId)
    expect(transaction).to.be.null()
  })

  it('throws an error if the bill run has already been billed', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    await forceStatus(br.id, 'billed') // HACK
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    expect(billRun.status).to.equal('billed')

    await expect(RemoveBillRun.call(regime, billRun.id)).to.reject(Error, 'Cannot remove BillRun because it has been billed')
  })
})
