const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
const Regime = require('../../app/models/regime')
const { addBillRunTransaction, cleanBillRuns } = require('../helpers/bill_run_helper')
const CreateBillRun = require('../../app/services/create_bill_run')
const FindTransactionByClientId = require('../../app/services/find_transaction_by_client_id')
const Schema = require('../../app/schema/pre_sroc')

describe('Find existing transaction', () => {
  let regime
  let schema
  let region
  let clientId

  before(async () => {
    regime = await Regime.find('wrls')
    schema = Schema[regime.slug]
    region = 'A'
    clientId = 'abc123'
  })

  beforeEach(async () => {
    await cleanBillRuns()
  })

  it('returns the matching transaction if one with the same regime and client id exists', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    const tId = await addBillRunTransaction(regime, billRun, { region: billRun.region, clientId })

    const result = await FindTransactionByClientId.call(regime, clientId)

    expect(result.id).to.equal(tId)
    expect(result.clientId).to.equal(clientId)
  })

  it('returns null if no transaction with the same regime and client id exists', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    await addBillRunTransaction(regime, billRun, { region: billRun.region, clientId })

    const result = await FindTransactionByClientId.call(regime, 'WRONG_CLIENT_ID')

    expect(result).to.equal(null)
  })
})
