const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
const Regime = require('../../app/models/regime')
const { addBillRunTransaction, addBillRunDeminimisTransaction, addBillRunMinimumChargeTransaction } = require('../helpers/bill_run_helper')
const CreateBillRun = require('../../app/services/create_bill_run')
const GenerateBillRunSummary = require('../../app/services/generate_bill_run_summary')
const { minimumChargeAmount } = require('../../config/config')

describe('Generate Bill Run Summary', () => {
  let regime
  let billRun

  beforeEach(async () => {
    regime = await Regime.find('wrls')
    const payload = {
      region: 'A'
    }
    const request = new (regime.schema.BillRunCreateRequest)(regime.id, payload)
    const result = await CreateBillRun.call(request)
    billRun = await regime.schema.BillRun.find(regime.id, result.id)
  })

  it('returns an error when bill run is empty', async () => {
    await expect(GenerateBillRunSummary.call(regime, billRun)).to.reject(Error, 'No records found for bill run')
  })

  it('returns a billrun summary', async () => {
    const tId = await addBillRunTransaction(regime, billRun, { region: 'A' })
    const transaction = await regime.schema.Transaction.find(regime.id, tId)
    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.billRunNumber).to.equal(br.bill_run_number)
    expect(summary.region).to.equal('A')
    expect(summary.approvedForBilling).to.be.false()
    expect(summary.summary.netTotal).to.equal(transaction.charge_value)
    expect(summary.customers[0].customerReference).to.equal(transaction.customerReference)
  })

  it('sets deminimis to false if payment is over 500', async () => {
    const tId = await addBillRunTransaction(regime, billRun, { region: 'A' })
    const transaction = await regime.schema.Transaction.find(regime.id, tId)
    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.customers[0].customerReference).to.equal(transaction.customerReference)
    expect(summary.customers[0].summaryByFinancialYear[0].deminimis).to.equal(false)
    expect(summary.customers[0].summaryByFinancialYear[0].transactions[0].deminimis).to.equal(false)
  })

  it('sets deminimis to true if payment is under 500', async () => {
    const tId = await addBillRunDeminimisTransaction(regime, billRun, { region: 'A' })
    const transaction = await regime.schema.Transaction.find(regime.id, tId)
    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.customers[0].customerReference).to.equal(transaction.customerReference)
    expect(summary.customers[0].summaryByFinancialYear[0].deminimis).to.equal(true)
    expect(summary.customers[0].summaryByFinancialYear[0].transactions[0].deminimis).to.equal(true)
  })

  it('correctly calculates invoiceValue with 2 transactions', async () => {
    const transactions = [
      await addBillRunTransaction(regime, billRun, { region: 'A' }),
      await addBillRunTransaction(regime, billRun, { region: 'A' })
    ]
    const resolvedTransactions = await Promise.all(transactions.map(tId => regime.schema.Transaction.find(regime.id, tId)))
    const transactionsTotal = resolvedTransactions.reduce((sum, transaction) => sum + transaction.charge_value, 0)

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.summary.netTotal).to.equal(transactionsTotal)
  })

  it('correctly calculates invoiceValue with 2 transactions where newLicence differs', async () => {
    const transactions = [
      await addBillRunTransaction(regime, billRun, { region: 'A', newLicence: true }),
      await addBillRunTransaction(regime, billRun, { region: 'A', newLicence: false })
    ]
    const resolvedTransactions = await Promise.all(transactions.map(tId => regime.schema.Transaction.find(regime.id, tId)))
    const transactionsTotal = resolvedTransactions.reduce((sum, transaction) => sum + transaction.charge_value, 0)

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.summary.netTotal).to.equal(transactionsTotal)
  })

  it('correctly applies minimum charge when newLicence is true', async () => {
    await addBillRunMinimumChargeTransaction(regime, billRun, { region: 'A', newLicence: true })

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.summary.netTotal).to.equal(minimumChargeAmount)
  })

  it('correctly applies minimum charge when newLicence is false', async () => {
    const tId = await addBillRunMinimumChargeTransaction(regime, billRun, { region: 'A', newLicence: false })
    const transaction = await regime.schema.Transaction.find(regime.id, tId)

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.summary.netTotal).to.equal(transaction.charge_value)
  })

  it('correctly applies minimum charge when newLicence is a mix of true and false', async () => {
    // Minimum charge does not apply when newLicence is true so we need to retrieve this transaction's actual value
    const tId = await addBillRunMinimumChargeTransaction(regime, billRun, { region: 'A', newLicence: true })
    const transaction = await regime.schema.Transaction.find(regime.id, tId)
    // Minimum charge applies to this transaction so we don't need its value
    await addBillRunMinimumChargeTransaction(regime, billRun, { region: 'A', newLicence: false })

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    const transactionsTotal = transaction.charge_value + minimumChargeAmount
    expect(summary.summary.netTotal).to.equal(transactionsTotal)
  })

  it.only('excludes zero charge transactions from the summary count', async () => {
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 50 })
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: -40 })
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 0 })

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    console.log(summary)

    expect(summary.summary.creditLineCount).to.equal(1)
    expect(summary.summary.debitLineCount).to.equal(1)
  })
})
