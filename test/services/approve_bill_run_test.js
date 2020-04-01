const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
// const createServer = require('../../app')
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

    await expect(ApproveBillRun.call(regime, billRun.id)).to.reject(Error, 'Cannot approve BillRun because it has been billed')
  })

  // it('sets the approved_for_billing flag on transactions in the region', async () => {
  //   await addTransaction(regime, { region: 'A' })
  //   await addTransaction(regime, { region: 'A' })
  //   await addTransaction(regime, { region: 'B' })

  //   const payload = {
  //     region: 'A'
  //   }
  //   // create a approval request object, validate and translate
  //   const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
  //   const result = await BulkApproval.call(approvalRequest)

  //   expect(result.approvedCount).to.equal(2)
  // })

  // it('sets the approved_for_billing flag on transactions in the region matching the batchNumber', async () => {
  //   await addTransaction(regime, { region: 'A', batchNumber: 'ABC123' })
  //   await addTransaction(regime, { region: 'A', batchNumber: 'XYZ987' })
  //   await addTransaction(regime, { region: 'B', batchNumber: 'ABC123' })

  //   const payload = {
  //     region: 'A',
  //     filter: {
  //       batchNumber: 'ABC123'
  //     }
  //   }
  //   // create a approval request object
  //   const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
  //   const result = await BulkApproval.call(approvalRequest)
  //   // only 1 should match region and batchNumber and be approved
  //   expect(result.approvedCount).to.equal(1)
  // })

  // it('sets the approved_for_billing flag on transactions in the region matching the licenceNumber', async () => {
  //   await addTransaction(regime, { region: 'A', licenceNumber: 'ABC/1234/*/XYZ/XXX' })
  //   await addTransaction(regime, { region: 'A', licenceNumber: 'XYZ987/999/*/QAZ12/1' })
  //   await addTransaction(regime, { region: 'B', licenceNumber: 'ABC/1234/*/XYZ/XXX' })

  //   const payload = {
  //     region: 'A',
  //     filter: {
  //       licenceNumber: 'ABC/1234/*/XYZ/XXX'
  //     }
  //   }
  //   // create a approval request object
  //   const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
  //   const result = await BulkApproval.call(approvalRequest)
  //   // only 1 should match region and licenceNumber and be approved
  //   expect(result.approvedCount).to.equal(1)
  // })

  // it('sets the approved_for_billing flag on transactions in the region matching the customerReference', async () => {
  //   await addTransaction(regime, { region: 'A', customerReference: 'AB12345678' })
  //   await addTransaction(regime, { region: 'A', customerReference: 'XY98765432' })
  //   await addTransaction(regime, { region: 'B', customerReference: 'AB12345678' })

  //   const payload = {
  //     region: 'A',
  //     filter: {
  //       customerReference: 'AB12345678'
  //     }
  //   }
  //   // create a approval request object
  //   const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
  //   const result = await BulkApproval.call(approvalRequest)
  //   // only 1 should match region and customerReference and be approved
  //   expect(result.approvedCount).to.equal(1)
  // })

  // it('sets the approved_for_billing flag on transactions in the region matching the financialYear', async () => {
  //   const t1Id = await addTransaction(regime, { region: 'A' })
  //   await updateTransaction(t1Id, { charge_financial_year: 2019 })
  //   const t2Id = await addTransaction(regime, { region: 'A' })
  //   await updateTransaction(t2Id, { charge_financial_year: 2020 })
  //   const t3Id = await addTransaction(regime, { region: 'B' })
  //   await updateTransaction(t3Id, { charge_financial_year: 2019 })

  //   const payload = {
  //     region: 'A',
  //     filter: {
  //       financialYear: 2019
  //     }
  //   }
  //   // create a approval request object
  //   const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
  //   const result = await BulkApproval.call(approvalRequest)
  //   // only 1 should match region and financialYear and be approved
  //   expect(result.approvedCount).to.equal(1)
  // })

  // it('sets the approved_for_billing flag on transactions in the region matching the filter', async () => {
  //   await addTransaction(regime, { region: 'A', customerReference: 'AB12345678', batchNumber: 'ABC123' })
  //   await addTransaction(regime, { region: 'A', customerReference: 'XY98765432', batchNumber: 'ABC123' })
  //   await addTransaction(regime, { region: 'B', customerReference: 'AB12345678', batchNumber: 'XYZ999' })

  //   const payload = {
  //     region: 'A',
  //     filter: {
  //       batchNumber: 'ABC123',
  //       customerReference: 'AB12345678'
  //     }
  //   }
  //   // create a approval request object
  //   const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
  //   const result = await BulkApproval.call(approvalRequest)
  //   // only 1 should match region, batchNumber and customerReference and be approved
  //   expect(result.approvedCount).to.equal(1)
  // })
})
