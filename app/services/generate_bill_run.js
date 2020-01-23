const Boom = require('@hapi/boom')
const DBTransaction = require('../lib/db_transaction')
const utils = require('../lib/utils')

// generate a new billrun and return a summary
async function call (billRun) {
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

  // if (!billRun.draft) {
  //   defaultArgs.approved_for_billing = true
  // }

  const filter = { ...billRun.filter, ...defaultArgs }

  const { where, values } = utils.buildWhereClause(filter)

  const stmt = `SELECT DISTINCT customer_reference FROM transactions WHERE ${where}`

  const db = new DBTransaction()

  try {
    await db.begin()

    const result = await db.query(stmt, values)

    if (result.rowCount === 0) {
      // nothing to do
      throw Boom.badData('No records found for bill run')
    }

    // now have a list of customer references for all of the transactions
    for (let n = 0; n < result.rowCount; n++) {
      const ref = result.rows[n].customer_reference
      const summary = await buildCustomerSummary(db, billRun, ref, filter)
      billRun.addSummary(summary)
    }

    if (!billRun.draft) {
      await billRun.generateFileId()
      await billRun.save(db)
      await updateTransactions(db, billRun, filter)
    }
    await db.commit()
  } catch (err) {
    await db.rollback()
    throw err
  } finally {
    db.release()
  }

  return billRun
}

async function buildCustomerSummary (db, billRun, customerRef, filter) {
  const summary = {
    customer_reference: customerRef,
    summary: []
  }

  const customerFilter = { customer_reference: customerRef, ...filter }

  const { where, values } = utils.buildWhereClause(customerFilter)
  const yrsStmt = `SELECT DISTINCT charge_financial_year::int FROM transactions WHERE ${where}`
  const years = await db.query(yrsStmt, values)

  for (let n = 0; n < years.rowCount; n++) {
    const year = years.rows[n].charge_financial_year
    const summaryForYear = await buildFinancialYearSummary(db, billRun, year, customerFilter)
    summary.summary.push(summaryForYear)
  }

  return summary
}

async function buildFinancialYearSummary (db, billRun, year, filter) {
  const summary = {
    financial_year: year,
    transactions: []
  }

  // filter.charge_financial_year = year
  const { where, values } = utils.buildWhereClause({ charge_financial_year: year, ...filter })
  // assumption that 0 would be a invoice
  const creditStmt = `SELECT id,charge_value FROM transactions WHERE ${where} AND charge_value < 0`
  const invoiceStmt = `SELECT id,charge_value FROM transactions WHERE ${where} AND charge_value >= 0`

  const credits = await db.query(creditStmt, values)
  const debits = await db.query(invoiceStmt, values)

  summary.credit_line_count = credits.rowCount
  summary.credit_line_value = credits.rows.reduce((total, row) => {
    summary.transactions.push({ id: row.id, charge_value: row.charge_value })
    return total + row.charge_value
  }, 0)

  summary.debit_line_count = debits.rowCount
  summary.debit_line_value = debits.rows.reduce((total, row) => {
    summary.transactions.push({ id: row.id, charge_value: row.charge_value })
    return total + row.charge_value
  }, 0)

  summary.net_total = summary.credit_line_value + summary.debit_line_value
  const transactionType = (summary.net_total < 0 ? 'C' : 'I')

  // NOTE: this is outside of the database transaction so won't rollback if there's an issue
  const transactionRef = await billRun.generateTransactionRef(transactionType === 'C')

  const upd = `UPDATE transactions SET bill_run_number=${billRun.billRunId},transaction_type='${transactionType}',transaction_reference='${transactionRef}' WHERE ${where}`
  await db.query(upd, values)

  return summary
}

async function updateTransactions (db, billRun, filter) {
  // update all included transactions with an association to the billRun
  // and change their status so they aren't visible in the billing queue
  const dateNow = utils.formatDate(new Date())
  const { where, values } = utils.buildWhereClause(filter)
  const upd = `UPDATE transactions SET bill_run_id='${billRun.id}', status='billed', transaction_date='${dateNow}', header_attr_1='${dateNow}' WHERE ${where}`
  return db.query(upd, values)
}

module.exports = {
  call
}
