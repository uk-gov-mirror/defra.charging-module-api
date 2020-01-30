const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
// const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const { addTransaction, updateTransaction, cleanTransactions } = require('../helpers/transaction_helper')
const BulkApproval = require('../../app/services/bulk_approval')
const Schema = require('../../app/schema/pre_sroc')

describe('Bulk approval', () => {
  let regime
  let schema

  before(async () => {
    regime = await Regime.find('wrls')
    schema = Schema[regime.slug]
  })

  beforeEach(async () => {
    await cleanTransactions()
  })

  it('sets the approved_for_billing flag on transactions in the region', async () => {
    await addTransaction(regime, { region: 'A' })
    await addTransaction(regime, { region: 'A' })
    await addTransaction(regime, { region: 'B' })

    const payload = {
      region: 'A'
    }
    // create a approval request object, validate and translate
    const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
    const result = await BulkApproval.call(approvalRequest)

    expect(result.approvedCount).to.equal(2)
  })

  it('sets the approved_for_billing flag on transactions in the region matching the batchNumber', async () => {
    await addTransaction(regime, { region: 'A', batchNumber: 'ABC123' })
    await addTransaction(regime, { region: 'A', batchNumber: 'XYZ987' })
    await addTransaction(regime, { region: 'B', batchNumber: 'ABC123' })

    const payload = {
      region: 'A',
      filter: {
        batchNumber: 'ABC123'
      }
    }
    // create a approval request object
    const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
    const result = await BulkApproval.call(approvalRequest)
    // only 1 should match region and batchNumber and be approved
    expect(result.approvedCount).to.equal(1)
  })

  it('sets the approved_for_billing flag on transactions in the region matching the licenceNumber', async () => {
    await addTransaction(regime, { region: 'A', licenceNumber: 'ABC/1234/*/XYZ/XXX' })
    await addTransaction(regime, { region: 'A', licenceNumber: 'XYZ987/999/*/QAZ12/1' })
    await addTransaction(regime, { region: 'B', licenceNumber: 'ABC/1234/*/XYZ/XXX' })

    const payload = {
      region: 'A',
      filter: {
        licenceNumber: 'ABC/1234/*/XYZ/XXX'
      }
    }
    // create a approval request object
    const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
    const result = await BulkApproval.call(approvalRequest)
    // only 1 should match region and licenceNumber and be approved
    expect(result.approvedCount).to.equal(1)
  })

  it('sets the approved_for_billing flag on transactions in the region matching the customerReference', async () => {
    await addTransaction(regime, { region: 'A', customerReference: 'AB12345678' })
    await addTransaction(regime, { region: 'A', customerReference: 'XY98765432' })
    await addTransaction(regime, { region: 'B', customerReference: 'AB12345678' })

    const payload = {
      region: 'A',
      filter: {
        customerReference: 'AB12345678'
      }
    }
    // create a approval request object
    const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
    const result = await BulkApproval.call(approvalRequest)
    // only 1 should match region and customerReference and be approved
    expect(result.approvedCount).to.equal(1)
  })

  it('sets the approved_for_billing flag on transactions in the region matching the financialYear', async () => {
    const t1Id = await addTransaction(regime, { region: 'A' })
    await updateTransaction(t1Id, { charge_financial_year: 2019 })
    const t2Id = await addTransaction(regime, { region: 'A' })
    await updateTransaction(t2Id, { charge_financial_year: 2020 })
    const t3Id = await addTransaction(regime, { region: 'B' })
    await updateTransaction(t3Id, { charge_financial_year: 2019 })

    const payload = {
      region: 'A',
      filter: {
        financialYear: 2019
      }
    }
    // create a approval request object
    const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
    const result = await BulkApproval.call(approvalRequest)
    // only 1 should match region and financialYear and be approved
    expect(result.approvedCount).to.equal(1)
  })

  it('sets the approved_for_billing flag on transactions in the region matching the filter', async () => {
    await addTransaction(regime, { region: 'A', customerReference: 'AB12345678', batchNumber: 'ABC123' })
    await addTransaction(regime, { region: 'A', customerReference: 'XY98765432', batchNumber: 'ABC123' })
    await addTransaction(regime, { region: 'B', customerReference: 'AB12345678', batchNumber: 'XYZ999' })

    const payload = {
      region: 'A',
      filter: {
        batchNumber: 'ABC123',
        customerReference: 'AB12345678'
      }
    }
    // create a approval request object
    const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)
    const result = await BulkApproval.call(approvalRequest)
    // only 1 should match region, batchNumber and customerReference and be approved
    expect(result.approvedCount).to.equal(1)
  })
})