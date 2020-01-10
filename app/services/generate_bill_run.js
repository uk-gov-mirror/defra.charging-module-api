const Boom = require('@hapi/boom')
const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')

// generate a new billrun and return a summary
async function call (billRun, schema) {
  // collate the transactions to be included
  // this always will be:
  //   regime_id = billRun.regimeId
  //   status = unbilled
  //   region = billRun.region
  //   approved_for_billing = true ?
  // optionally further restricted by billRun.filter
  //
  const defaultArgs = {
    regime_id: billRun.regimeId,
    status: 'unbilled',
    region: billRun.region
    // approved_for_billing: true
  }

  const filter = Object.assign(billRun.filter || {}, defaultArgs)

  const { where, values } = utils.buildWhereClause(filter)

  const stmt = `SELECT DISTINCT customer_reference FROM transactions WHERE ${where}`

  const result = await pool.query(stmt, values)

  if (result.rowCount === 0) {
    // nothing to do
    throw Boom.badData('No records found for bill run')
  }

  // now have a list of customer references for all of the transactions
  for (let n = 0; n < result.rowCount; n++) {
    const ref = result.rows[n].customer_reference
    const summary = await buildCustomerSummary(billRun, ref, filter)
    billRun.addSummary(summary)
  }

  return billRun
}

async function buildCustomerSummary (billRun, customerRef, filter) {
  filter.customer_reference = customerRef

  const summary = {
    customer_reference: customerRef,
    summary: []
  }

  const { where, values } = utils.buildWhereClause(filter)
  const yrsStmt = `SELECT DISTINCT charge_financial_year::int FROM transactions WHERE ${where}`
  const years = await pool.query(yrsStmt, values)

  for (let n = 0; n < years.rowCount; n++) {
    const year = years.rows[n].charge_financial_year
    const summaryForYear = await buildFinancialYearSummary(billRun, year, filter)
    summary.summary.push(summaryForYear)
  }

  return summary
}

async function buildFinancialYearSummary (billRun, year, filter) {
  const summary = {
    financial_year: year,
    transactions: []
  }

  // filter.charge_financial_year = year
  const { where, values } = utils.buildWhereClause({ charge_financial_year: year, ...filter })
  // assumption that 0 would be a invoice
  const creditStmt = `SELECT id,charge_value FROM transactions WHERE ${where} AND charge_value < 0`
  const invoiceStmt = `SELECT id,charge_value FROM transactions WHERE ${where} AND charge_value >= 0`

  const results = await Promise.all([
    pool.query(creditStmt, values),
    pool.query(invoiceStmt, values)
  ])

  summary.credit_line_count = results[0].rowCount
  summary.credit_line_value = results[0].rows.reduce((total, row) => {
    summary.transactions.push({ id: row.id, charge_value: row.charge_value })
    return total + row.charge_value
  }, 0)

  summary.debit_line_count = results[1].rowCount
  summary.debit_line_value = results[1].rows.reduce((total, row) => {
    summary.transactions.push({ id: row.id, charge_value: row.charge_value })
    return total + row.charge_value
  }, 0)

  summary.net_total = summary.credit_line_value + summary.debit_line_value
  const transactionType = (summary.net_total < 0 ? 'C' : 'I')
  const transactionRef = await billRun.generateTransactionRef(transactionType === 'C')
  const upd = `UPDATE transactions SET bill_run_number=${billRun.billRunId},transaction_type='${transactionType}',transaction_reference='${transactionRef}' WHERE ${where}`
  await pool.query(upd, values)

  return summary
}

module.exports = {
  call
}
