const Sinon = require('sinon')
const RuleService = require('../../app/lib/connectors/rules')
const AddBillRunTransaction = require('../../app/services/add_bill_run_transaction')
const { DatabaseHelper, pool } = require('./database_helper')
const { buildTransaction } = require('./transaction_helper')
const { dummyCharge } = require('./charge_helper')
const { InitialisedBillRun } = require('../fixtures/bill_runs')

async function createBillRun (regimeId, region, alternateData = {}) {
  const billrun = await InitialisedBillRun(regimeId, region, alternateData)
  const result = await DatabaseHelper.createRecord('bill_runs', billrun)

  return result.id
}

async function cleanBillRuns () {
  await DatabaseHelper.cleanRecords('bill_runs')
}

async function addBillRunTransaction (regime, billRun, transactionData = {}, chargeData = {}) {
  const stub = Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge(chargeData))
  const transaction = buildTransaction(regime, transactionData)

  const result = await AddBillRunTransaction.call(regime, billRun, transaction, regime.schema)
  stub.restore()

  return result
}

async function addBillRunDeminimisTransaction (regime, billRun, transactionData = {}, chargeData = {}) {
  return addBillRunTransaction(regime, billRun, transactionData, { ...chargeData, chargeValue: 0.01 })
}

async function addBillRunMinimumChargeTransaction (regime, billRun, transactionData = {}, chargeData = {}) {
  return addBillRunTransaction(regime, billRun, transactionData, { ...chargeData, chargeValue: 20 })
}

async function forceStatus (billRunId, state) {
  return pool.query('UPDATE bill_runs SET status=$1 WHERE id=$2::uuid', [state, billRunId])
}

async function forceApproval (billRunId, state) {
  const r1 = await pool.query('UPDATE bill_runs SET approved_for_billing=$1 WHERE id=$2::uuid', [state, billRunId])
  const r2 = await pool.query('UPDATE transactions SET approved_for_billing=$1 WHERE bill_run_id=$2::uuid', [state, billRunId])
  return {
    billRun: r1.rowCount,
    transactions: r2.rowCount
  }
}

async function addTransctionsAndApprove (br, regime, schema, charges) {
  const billRun = await (schema.BillRun).find(regime.id, br.id)
  const tIds = []

  // Use for instead of forEach as this supports await
  for (const value of charges) {
    // This transaction is a credit if we're passed a value < 0
    const credit = value < 0
    // Transactions are always added with a positive amount
    const chargeValue = Math.abs(value)

    const tId = await addBillRunTransaction(regime, billRun, { region: billRun.region, credit }, { chargeValue })
    tIds.push(tId)
  }

  // HACK: set approved_for_billing on billrun and transactions
  await forceApproval(br.id, true)

  // reload billRun
  const reloadedBillRun = await (schema.BillRun).find(regime.id, billRun.id)

  return { billRun: reloadedBillRun, tIds }
}

module.exports = {
  cleanBillRuns,
  createBillRun,
  forceStatus,
  forceApproval,
  addBillRunTransaction,
  addBillRunDeminimisTransaction,
  addBillRunMinimumChargeTransaction,
  addTransctionsAndApprove
}
