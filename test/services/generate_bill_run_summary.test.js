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
    expect(summary.preSroc).to.be.true()
    expect(summary.summary.netTotal).to.equal(transaction.charge_value)
    expect(summary.customers[0].customerReference).to.equal(transaction.customerReference)
  })

  it('can generate bill runs with totals bigger than a PostgreSQL integer', async () => {
    const transactions = [
      await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 11070005 }),
      await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 11070005 })
    ]
    const resolvedTransactions = await Promise.all(transactions.map(tId => regime.schema.Transaction.find(regime.id, tId)))
    const transactionsTotal = resolvedTransactions.reduce((sum, transaction) => sum + transaction.charge_value, 0)

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.summary.netTotal).to.equal(transactionsTotal)
    expect(summary.summary.netTotal).to.be.above(2147483647)
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

  it('correctly sets deminimis flags to true where a credit exists in an invoice <£5', async () => {
    // Confirmed that deminimis flag should be true for all transactions when deminimis applies to the invoice
    // https://trello.com/c/C4XqrqWr/328-316-observation-credit-transaction-is-labelled-as-de-minimis-if-part-of-a-positive-invoice-where-de-minimis-transaction-is-inclu
    await addBillRunDeminimisTransaction(regime, billRun, { region: 'A' })
    await addBillRunDeminimisTransaction(regime, billRun, { region: 'A', credit: true })
    await addBillRunDeminimisTransaction(regime, billRun, { region: 'A' })

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.customers[0].summaryByFinancialYear[0].deminimis).to.equal(true)
    summary.customers[0].summaryByFinancialYear[0].transactions.forEach(transaction => {
      expect(transaction.deminimis).to.equal(true)
    })
  })

  it('correctly sets deminimis flags to false where a credit exists in an invoice >£5', async () => {
    await addBillRunTransaction(regime, billRun, { region: 'A' })
    await addBillRunTransaction(regime, billRun, { region: 'A', credit: true })
    await addBillRunTransaction(regime, billRun, { region: 'A' })

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.customers[0].summaryByFinancialYear[0].deminimis).to.equal(false)
    summary.customers[0].summaryByFinancialYear[0].transactions.forEach(transaction => {
      expect(transaction.deminimis).to.equal(false)
    })
  })

  it('correctly sets deminimis flags to true for zero value transactions in a deminimis invoice', async () => {
    await addBillRunTransaction(regime, billRun, { region: 'A' })
    await addBillRunTransaction(regime, billRun, { region: 'A', credit: true })
    await addBillRunDeminimisTransaction(regime, billRun, { region: 'A' })
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 0 })

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.customers[0].summaryByFinancialYear[0].deminimis).to.equal(true)
    summary.customers[0].summaryByFinancialYear[0].transactions.forEach(transaction => {
      expect(transaction.deminimis).to.equal(true)
    })
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

  it('correctly applies minimum charge for credits when newLicence is true', async () => {
    await addBillRunTransaction(regime, billRun, { region: 'A', newLicence: true }, { chargeValue: -20 })
    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.summary.netTotal).to.equal(-minimumChargeAmount)
  })

  it('correctly applies minimum charge for mixed credits and debits below minimum charge when newLicence is true', async () => {
    await addBillRunMinimumChargeTransaction(regime, billRun, { region: 'A', newLicence: true })
    await addBillRunTransaction(regime, billRun, { region: 'A', newLicence: true }, { chargeValue: -20 })
    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    // Minimum charge is applied separately to a group of credits and a group of debits
    // Therefore if minimum charge applies to both then they are both adjusted to the same value
    // cancelling each other out so the net total is £0
    expect(summary.summary.netTotal).to.equal(0)
  })

  it('correctly applies minimum charge for mixed credits and debits when newLicence is true', async () => {
    await addBillRunMinimumChargeTransaction(regime, billRun, { region: 'A', newLicence: true })
    await addBillRunTransaction(regime, billRun, { region: 'A', newLicence: true }, { chargeValue: -30 })
    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    // Minimum charge debit is rounded up to 2500
    // Minimum charge credit is left at 3000
    // Therefore expected net total is -500
    expect(summary.summary.netTotal).to.equal(-500)
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

  it('correctly calculates the summary counts', async () => {
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 200 })
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: -100 })
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 0 })

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()

    expect(summary.summary.creditLineCount).to.equal(1)
    expect(summary.summary.debitLineCount).to.equal(1)
    expect(summary.summary.zeroValueLineCount).to.equal(1)
  })

  it('includes all transactions in the summary', async () => {
    const chargeId = await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 200 })
    const creditId = await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: -100 })
    const zeroId = await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 0 })

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()
    const { transactions } = summary.customers[0].summaryByFinancialYear[0]
    const transactionIds = transactions.map(transaction => transaction.id)

    expect(transactionIds).to.contain(chargeId)
    expect(transactionIds).to.contain(creditId)
    expect(transactionIds).to.contain(zeroId)
  })

  it('correctly updates the summary for zero value transactions when newLicence is true', async () => {
    const zeroId = await addBillRunTransaction(regime, billRun, { region: 'A', newLicence: true }, { chargeValue: 0 })

    const br = await GenerateBillRunSummary.call(regime, billRun)
    const summary = br.summary()
    const { transactions } = summary.customers[0].summaryByFinancialYear[0]
    const transactionIds = transactions.map(transaction => transaction.id)

    expect(summary.summary.zeroValueLineCount).to.equal(1)
    expect(transactionIds).to.contain(zeroId)
  })

  it('sets netZeroValueInvoice flag to true if net total is 0', async () => {
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 200 })
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: -200 })

    const br = await GenerateBillRunSummary.call(regime, billRun)

    const summary = br.summary()
    const { transactions } = summary.customers[0].summaryByFinancialYear[0]

    expect(transactions[0].netZeroValueInvoice).to.equal(true)
    expect(transactions[1].netZeroValueInvoice).to.equal(true)
  })

  it('sets netZeroValueInvoice flag to false if net total is not 0', async () => {
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 200 })
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: -100 })

    const br = await GenerateBillRunSummary.call(regime, billRun)

    const summary = br.summary()
    const { transactions } = summary.customers[0].summaryByFinancialYear[0]

    expect(transactions[0].netZeroValueInvoice).to.equal(false)
    expect(transactions[1].netZeroValueInvoice).to.equal(false)
  })

  it('calculates credit and debit totals and counts as 0 for net zero value invoices', async () => {
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: 200 })
    await addBillRunTransaction(regime, billRun, { region: 'A' }, { chargeValue: -200 })

    const br = await GenerateBillRunSummary.call(regime, billRun)

    const { summary } = br.summary()

    expect(summary.creditLineCount).to.equal(0)
    expect(summary.debitLineCount).to.equal(0)
    expect(summary.creditLineValue).to.equal(0)
    expect(summary.debitLineValue).to.equal(0)
  })
})
