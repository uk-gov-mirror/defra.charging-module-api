const { pool } = require('../../app/lib/connectors/db')
const Sinon = require('sinon')
const RuleService = require('../../app/lib/connectors/rules')
const AddBillRunTransaction = require('../../app/services/add_bill_run_transaction')
const { buildTransaction } = require('./transaction_helper')
const { dummyCharge } = require('./charge_helper')

async function billRunCount () {
  const result = await pool.query('SELECT count(*)::int from bill_runs')
  return result.rows[0].count
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

async function cleanBillRuns () {
  return pool.query('DELETE from bill_runs')
}

async function addTransctionsAndApprove (br, regime, schema, charges) {
  const billRun = await (schema.BillRun).find(regime.id, br.id)
  const tIds = []

  // Use for instead of forEach as this supports await
  for (const chargeValue of charges) {
    const tId = await addBillRunTransaction(regime, billRun, { region: billRun.region }, { chargeValue })
    tIds.push(tId)
  }

  // HACK: set approved_for_billing on billrun and transactions
  await forceApproval(br.id, true)

  // reload billRun
  const reloadedBillRun = await (schema.BillRun).find(regime.id, billRun.id)

  return { billRun: reloadedBillRun, tIds }
}

module.exports = {
  billRunCount,
  cleanBillRuns,
  forceStatus,
  forceApproval,
  addBillRunTransaction,
  addBillRunDeminimisTransaction,
  addBillRunMinimumChargeTransaction,
  addTransctionsAndApprove
}
