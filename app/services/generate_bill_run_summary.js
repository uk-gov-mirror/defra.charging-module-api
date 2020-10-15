const Boom = require('@hapi/boom')
const DBTransaction = require('../lib/db_transaction')
const utils = require('../lib/utils')
const config = require('../../config/config')

// generate a new billrun and return a summary
async function call (regime, billRun) {
  // collate the transactions to be included
  // this always will be:
  //   regime_id = billRun.regimeId
  //   status = unbilled
  //   region = billRun.region
  //   approved_for_billing = true ?
  //
  const defaultArgs = {
    regime_id: regime.id,
    bill_run_id: billRun.id,
    // status: 'unbilled',
    region: billRun.region
  }

  const filter = defaultArgs

  const { where, values } = utils.buildWhereClause(filter)

  const stmt = `SELECT DISTINCT customer_reference FROM transactions WHERE ${where} ORDER BY customer_reference ASC`

  const db = new DBTransaction()

  try {
    await db.begin()

    const result = await db.query(stmt, values)

    if (result.rowCount === 0) {
      throw Boom.badData('No records found for bill run')
    }

    // Read the bill run status so we can restore it later
    const billRunStatus = billRun.status

    // Set the status to 'generating_summary'
    await billRun.generatingSummary(db)
    await db.commit()

    // now have a list of customer references for all of the transactions
    for (let n = 0; n < result.rowCount; n++) {
      const ref = result.rows[n].customer_reference
      const summary = await buildCustomerSummary(db, regime, billRun, ref, filter)
      billRun.addSummary(summary)
    }

    // Restore the original status
    await billRun.setStatus(db, billRunStatus)

    await billRun.save(db)
    await db.commit()
  } catch (err) {
    await db.rollback()
    throw err
  } finally {
    db.release()
  }

  return billRun
}

async function buildCustomerSummary (db, regime, billRun, customerRef, filter) {
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
    const summaryForYear = await buildFinancialYearSummary(db, regime, billRun, year, customerFilter)
    summary.summary.push(summaryForYear)
  }

  return summary
}

async function buildFinancialYearSummary (db, regime, billRun, year, filter) {
  const { where, values } = utils.buildWhereClause({ charge_financial_year: year, ...filter })

  // assumption that 0 would be a invoice
  const attrs = ['id', 'charge_value', ...billRun.summaryAdditionalAttributes].join(',')

  const customerLevelStatement = (attrs, where, chargeCondition) => `SELECT ${attrs} FROM transactions WHERE ${where} AND ${chargeCondition} AND new_licence = false`

  // summarise zero value charges (excluding new licences)
  const zeroValueStmt = customerLevelStatement(attrs, where, 'charge_value = 0')
  const { summary: zeroChargeSummary } = await createCustomerLevelSummary(zeroValueStmt, values, db)

  // summarise credits (excluding new licences)
  const creditStmt = customerLevelStatement(attrs, where, 'charge_value < 0')
  const { summary: creditSummary } = await createCustomerLevelSummary(creditStmt, values, db)

  // summarise debits (excluding new licences)
  const invoiceStmt = customerLevelStatement(attrs, where, 'charge_value > 0')
  const { summary: debitSummary } = await createCustomerLevelSummary(invoiceStmt, values, db)

  // Build summary from customer level summaries
  const summary = {
    financial_year: year,
    credit_line_count: creditSummary.lineCount ? creditSummary.lineCount : 0,
    credit_line_value: creditSummary.lineValue ? creditSummary.lineValue : 0,
    debit_line_count: debitSummary.lineCount ? debitSummary.lineCount : 0,
    debit_line_value: debitSummary.lineValue ? debitSummary.lineValue : 0,
    zero_value_line_count: zeroChargeSummary.lineCount,
    transactions: [...zeroChargeSummary.transactions, ...creditSummary.transactions, ...debitSummary.transactions]
  }

  // new licences / minimum charge - handled at licence level
  const newLicStmt = `SELECT DISTINCT line_attr_1 FROM transactions WHERE ${where} AND new_licence = true`
  const newLicences = await db.query(newLicStmt, values)

  if (newLicences.rowCount) {
    for (const row of newLicences.rows) {
      // Get the licence id and create credit and debit summaries at licence level

      // TODO: createLicenceLevelSummary also applies minimum charge and creates adjustment transaction as appropriate
      //  refactor to separate this out

      const licence = row.line_attr_1

      const licenceLevelStatement = (attrs, where, licence, chargeCondition) => `SELECT ${attrs} FROM transactions WHERE ${where} AND ${chargeCondition} AND line_attr_1='${licence}' AND new_licence = true AND minimum_charge_adjustment = false`

      const zeroValueNewStmt = licenceLevelStatement(attrs, where, licence, 'charge_value = 0')
      const newZeroValue = await createLicenceLevelSummary(db, zeroValueNewStmt, values, regime, billRun, attrs)
      summary.zero_value_line_count += newZeroValue.lineCount
      summary.transactions = [...summary.transactions, ...newZeroValue.transactions]

      const creditNewStmt = licenceLevelStatement(attrs, where, licence, 'charge_value < 0')
      const newCredits = await createLicenceLevelSummary(db, creditNewStmt, values, regime, billRun, attrs)
      summary.credit_line_count += newCredits.lineCount
      summary.credit_line_value += newCredits.lineValue
      summary.transactions = [...summary.transactions, ...newCredits.transactions]

      const invoiceNewStmt = licenceLevelStatement(attrs, where, licence, 'charge_value > 0')
      const newDebits = await createLicenceLevelSummary(db, invoiceNewStmt, values, regime, billRun, attrs)
      summary.debit_line_count += newDebits.lineCount
      summary.debit_line_value += newDebits.lineValue
      summary.transactions = [...summary.transactions, ...newDebits.transactions]
    }
  }

  summary.net_total = summary.credit_line_value + summary.debit_line_value

  const deminimisSummary = await calculateDeminimis(summary, db, where, values)

  return deminimisSummary
}

// Create summary at licence level and apply minimum charge
async function createLicenceLevelSummary (db, where, values, regime, billRun, attrs) {
  const { summary, parentId } = await createCustomerLevelSummary(where, values, db)

  // Now that the summary is created we apply minimum charge logic

  // Return early if there are no new licence lines as minimum charge does not apply
  if (!summary.lineCount) {
    return summary
  }

  // Return early if all lines are zero value transactions as minimum charge does not apply
  const zeroTransactions = summary.transactions.filter(transaction => transaction.charge_value === 0)
  if (summary.transactions.length === zeroTransactions.length) {
    return summary
  }

  // Calculate the current value and the difference from the minimum charge amount
  const currentValue = summary.lineValue
  const amount = config.minimumChargeAmount - Math.abs(currentValue)

  // Check if the difference is over 0 (ie. there is a shortfall)
  // If there is, create a new minimum charge adjustment and adjust the summary
  if (amount > 0) {
    // Change sign of adjustment amount based on whether the value to correct is positive or negative
    // This gives us the proper amount to correct by
    const adjustmentAmount = amount * Math.sign(currentValue)
    const transaction = await addMinimumChargeAdjustment(db, regime, billRun, parentId, adjustmentAmount, attrs)
    summary.transactions.push(transaction)
    summary.lineCount++
    summary.lineValue += adjustmentAmount
  }

  return summary
}

// Return summary at customer level
async function createCustomerLevelSummary (query, values, db) {
  const results = await db.query(query, values)

  // Calculate the number of lines and total value of all lines
  // Use these to populate the summary along with the individual transactions
  const summary = {
    lineCount: results.rowCount,
    lineValue: results.rows.reduce((total, row) => total + row.charge_value, 0),
    transactions: results.rows
  }

  // parentId is taken from the transactions, or null if there are none
  const parentId = results.rows.length ? results.rows[0].id : null

  return { summary, parentId }
}

async function calculateDeminimis (summary, db, where, values) {
  // Determine whether deminimis applies
  const deminimis = summary.net_total > 0 && summary.net_total < 500

  // Add deminimis flag to each transaction
  const transactions = summary.transactions.map(transaction => ({
    ...transaction,
    deminimis: transaction.charge_value > 0 ? deminimis : false
  }))

  // Update deminimis flags in database
  const updateDeminimis = `UPDATE transactions SET deminimis = ${deminimis} WHERE ${where} AND charge_value > 0`
  await db.query(updateDeminimis, values)

  // Return summary with updated transactions and deminimis flag
  return { ...summary, transactions, deminimis }
}

async function addMinimumChargeAdjustment (db, regime, billRun, parentId, amount, returnAttrs) {
  // add adjustment transaction
  // make payload
  const parent = await (regime.schema.Transaction).find(regime.id, parentId)

  const params = parent.generateMinimumChargeAttrs(amount)

  const names = []
  const values = []
  const data = []
  let attrCount = 1

  Object.entries(params).forEach(kv => {
    names.push(kv[0])
    values.push(`$${attrCount++}`)
    data.push(kv[1])
  })

  const stmt = `INSERT INTO transactions (${names.join(',')}) VALUES (${values.join(',')}) RETURNING ${returnAttrs}`
  const result = await db.query(stmt, data)
  return result.rows[0]
}

module.exports = {
  call
}
