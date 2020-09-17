const Lab = require('@hapi/lab')
// const Code = require('@hapi/code')
const { describe, it, before, beforeEach, afterEach } = exports.lab = Lab.script()
// const { expect } = Code
const Regime = require('../../app/models/regime')
const { addBillRunTransaction, cleanBillRuns } = require('../helpers/bill_run_helper')
const CreateBillRun = require('../../app/services/create_bill_run')
const ViewBillRun = require('../../app/services/view_bill_run')
const GenerateBillRunSummary = require('../../app/services/generate_bill_run_summary')
const Schema = require('../../app/schema/pre_sroc')
const { expect } = require('@hapi/code')
const Sinon = require('sinon')
const Config = require('../../config/config')

describe('View bill run', () => {
  let regime
  let schema

  before(async () => {
    regime = await Regime.find('wrls')
    schema = Schema[regime.slug]
  })

  beforeEach(async () => {
    await cleanBillRuns()
  })

  afterEach(() => {
    Sinon.restore()
  })

  function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  it('correctly returns the bill run', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    await addBillRunTransaction(regime, billRun, { region: billRun.region })
    const request = new (regime.schema.BillRunViewRequest)(regime, br.id)

    const viewBillRun = await ViewBillRun.call(request)

    // reload billRun
    const reloadedBillRun = await (schema.BillRun).find(regime.id, billRun.id)

    // Create an object mapping viewBillRun basic info to billRun
    // These aren't all viewBillRun getters so we access them directly
    const checkValues = {
      id: 'id',
      billRunNumber: 'bill_run_number',
      region: 'region',
      status: 'status',
      approvedForBilling: 'approved_for_billing',
      preSroc: 'pre_sroc'
    }

    // Iterate over checkValues comparing viewBillRun to reloadedBillRun
    Object.keys(checkValues).forEach(key => {
      expect(viewBillRun[key]).to.equal(reloadedBillRun[checkValues[key]])
    })

    // Compare viewBillRun summary to values in reloadedBillRun
    Object.keys(viewBillRun.summary).forEach(key => {
      expect(viewBillRun.summary.key).to.equal(reloadedBillRun[key])
    })
  })

  it('returns the holding response after summary generation times out', async () => {
    // Set timeout value to 0 to ensure the holding response is returned ASAP
    Sinon.replace(Config, 'billRunSummaryTimeout', 0)

    // Stub GenerateBillRunSummary.call() to prevent it from trying to save to the database
    // This would happen after this test has been torn down and would throw an error during a subsequent test
    Sinon.stub(GenerateBillRunSummary, 'call').callsFake(async function fakeFn (regime, billRun) {
      // Small delay required to ensure it doesn't return before the holding response
      await sleep(100)
      return false
    })

    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const billRun = await (schema.BillRun).find(regime.id, br.id)
    await addBillRunTransaction(regime, billRun, { region: billRun.region })
    const request = new (regime.schema.BillRunViewRequest)(regime, br.id)

    const viewBillRun = await ViewBillRun.call(request)

    expect(viewBillRun).to.equal(billRun.holdingResponse)
  })

  it('returns appropriate error response if bill run contains no transactions', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const request = new (regime.schema.BillRunViewRequest)(regime, br.id)

    await expect(ViewBillRun.call(request)).to.reject(Error, 'No records found for bill run')
  })
})
