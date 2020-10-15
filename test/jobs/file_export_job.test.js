const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
const Regime = require('../../app/models/regime')
const { addTransctionsAndApprove, cleanBillRuns } = require('../helpers/bill_run_helper')
const FileExportJob = require('../../app/jobs/file_export_job')
const CreateBillRun = require('../../app/services/create_bill_run')
const SendBillRun = require('../../app/services/send_bill_run')
const Schema = require('../../app/schema/pre_sroc')
const CreateFile = require('../../app/services/create_file')
const MoveFileToS3 = require('../../app/services/move_file_to_s3')

describe('File export job', () => {
  let regime
  let schema
  let createFileStub
  let moveFileToS3Stub

  before(async () => {
    regime = await Regime.find('wrls')
    schema = Schema[regime.slug]
    createFileStub = Sinon.stub(CreateFile, 'call')
    moveFileToS3Stub = Sinon.stub(MoveFileToS3, 'call')
  })

  beforeEach(async () => {
    await cleanBillRuns()
    createFileStub.resetHistory()
    moveFileToS3Stub.resetHistory()
  })

  it('runs correctly when a valid bill run has been sent', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun, tIds } = await addTransctionsAndApprove(br, regime, schema, [50])

    await SendBillRun.call(regime, billRun)
    await FileExportJob.run()

    const transaction = await (schema.Transaction).find(regime.id, tIds[0])
    expect(transaction.isBilled).to.equal(true)
    expect(transaction.transaction_reference).to.not.equal(null)
    expect(transaction.transaction_date).to.not.equal(null)
  })

  it('doesn\'t assign transaction reference or date to zero value transaction', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun, tIds } = await addTransctionsAndApprove(br, regime, schema, [50, 0])

    await SendBillRun.call(regime, billRun)
    await FileExportJob.run()

    const transaction = await (schema.Transaction).find(regime.id, tIds[0])
    expect(transaction.transaction_reference).to.not.equal(null)
    expect(transaction.transaction_date).to.not.equal(null)
    const zeroValueTransaction = await (schema.Transaction).find(regime.id, tIds[1])
    expect(zeroValueTransaction.transaction_reference).to.equal(null)
    expect(zeroValueTransaction.transaction_date).to.equal(null)
  })

  it('doesn\'t assign transaction reference or date to deminimis transaction', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun, tIds } = await addTransctionsAndApprove(br, regime, schema, [0.01])

    await SendBillRun.call(regime, billRun)
    await FileExportJob.run()

    const transaction = await (schema.Transaction).find(regime.id, tIds[0])
    expect(transaction.transaction_reference).to.equal(null)
    expect(transaction.transaction_date).to.equal(null)
  })

  it('generates a file if the bill run contains regular transactions', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun } = await addTransctionsAndApprove(br, regime, schema, [50])

    await SendBillRun.call(regime, billRun)
    await FileExportJob.run()

    const sentBillRun = await (schema.BillRun).find(regime.id, billRun.id)

    expect(sentBillRun.status).to.equal('billed')
    expect(createFileStub.called).to.equal(true)
    expect(moveFileToS3Stub.called).to.equal(true)
  })

  it('doesn\'t generate a file if the bill run only contains zero value transactions', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun } = await addTransctionsAndApprove(br, regime, schema, [0])

    await SendBillRun.call(regime, billRun)
    await FileExportJob.run()

    const sentBillRun = await (schema.BillRun).find(regime.id, billRun.id)

    expect(sentBillRun.status).to.equal('billing_not_required')
    expect(createFileStub.called).to.equal(false)
    expect(moveFileToS3Stub.called).to.equal(false)
  })

  it('generates a file if the bill run is a mix of regular and zero value transactions', async () => {
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    const { billRun } = await addTransctionsAndApprove(br, regime, schema, [50, 0])

    await SendBillRun.call(regime, billRun)
    await FileExportJob.run()

    const sentBillRun = await (schema.BillRun).find(regime.id, billRun.id)

    expect(sentBillRun.status).to.equal('billed')
    expect(createFileStub.called).to.equal(true)
    expect(moveFileToS3Stub.called).to.equal(true)
  })
})
