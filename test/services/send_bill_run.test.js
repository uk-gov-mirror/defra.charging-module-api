const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code
// const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const { addTransctionsAndApprove, cleanBillRuns } = require('../helpers/bill_run_helper')
const CreateBillRun = require('../../app/services/create_bill_run')
const SendBillRun = require('../../app/services/send_bill_run')
const GenerateBillRunSummary = require('../../app/services/generate_bill_run_summary')
const Schema = require('../../app/schema/pre_sroc')
const Sinon = require('sinon')
const Config = require('../../config/config')

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

  afterEach(() => {
    Sinon.restore()
  })

  function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  it('sends a bill run', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun } = await addTransctionsAndApprove(br, regime, schema, [50])

    const sentBillRun = await SendBillRun.call(regime, billRun)

    expect(sentBillRun.status).to.equal('pending')
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

  it('creates the summary when it doesn\'t already exist', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun } = await addTransctionsAndApprove(br, regime, schema, [50])

    // Confirm summary isn't present
    expect(billRun.invoice_count).to.equal(0)

    const sentBillRun = await SendBillRun.call(regime, billRun)

    expect(sentBillRun.invoice_count).to.equal(1)
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
    const { billRun } = await addTransctionsAndApprove(br, regime, schema, [50])
    const sentBillRun = await SendBillRun.call(regime, billRun)

    expect(sentBillRun).to.equal(billRun.holdingResponse)
  })
})
