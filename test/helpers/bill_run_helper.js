const { pool } = require('../../app/lib/connectors/db')
const Sinon = require('sinon')
const RuleService = require('../../app/lib/connectors/rules')
const AddBillRunTransaction = require('../../app/services/add_bill_run_transaction')
const { buildTransaction } = require('./transaction_helper')
const { dummyCharge, deminimisCharge } = require('./charge_helper')

async function billRunCount () {
  const result = await pool.query('SELECT count(*)::int from bill_runs')
  return result.rows[0].count
}

async function addBillRunTransaction (regime, billRun, data = {}) {
  const stub = Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge())
  const transaction = buildTransaction(regime, data)

  const result = await AddBillRunTransaction.call(regime, billRun, transaction, regime.schema)
  stub.restore()

  return result
}

async function addBillRunDeminimisTransaction (regime, billRun, data = {}) {
  const stub = Sinon.stub(RuleService, 'calculateCharge').resolves(deminimisCharge())
  const transaction = buildTransaction(regime, data)

  const result = await AddBillRunTransaction.call(regime, billRun, transaction, regime.schema)
  stub.restore()

  return result
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

module.exports = {
  billRunCount,
  cleanBillRuns,
  forceStatus,
  forceApproval,
  addBillRunTransaction,
  addBillRunDeminimisTransaction
}
