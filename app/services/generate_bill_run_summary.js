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
  // optionally further restricted by billRun.filter
  //
  const defaultArgs = {
    regime_id: regime.id,
    bill_run_id: billRun.id,
    // status: 'unbilled',
    region: billRun.region
  }

  // transactions must be approved to be included when not a draft bill run
  // if (!billRun.draft) {
  //   defaultArgs.approved_for_billing = true
  // }

  // const filter = { ...billRun.filter, ...defaultArgs }
  const filter = defaultArgs

  const { where, values } = utils.buildWhereClause(filter)

  const stmt = `SELECT DISTINCT customer_reference FROM transactions WHERE ${where} ORDER BY customer_reference ASC`

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
      const summary = await buildCustomerSummary(db, regime, billRun, ref, filter)
      billRun.addSummary(summary)
    }

    // if (finalise) {
    //   await billRun.generateFileId()
    //   await updateTransactions(db, billRun, filter)
    // }

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
  const summary = {
    financial_year: year,
    credit_line_count: 0,
    credit_line_value: 0,
    debit_line_count: 0,
    debit_line_value: 0,
    transactions: []
  }

  // filter.charge_financial_year = year
  const { where, values } = utils.buildWhereClause({ charge_financial_year: year, ...filter })

  // assumption that 0 would be a invoice
  const attrs = ['id', 'charge_value', ...billRun.summaryAdditionalAttributes].join(',')

  // summarize credits at customer level (excluding new licences)
  const creditStmt = `SELECT ${attrs} FROM transactions WHERE ${where} AND charge_value < 0 AND new_licence = false`
  const credits = await db.query(creditStmt, values)
  summary.credit_line_count = credits.rowCount
  summary.credit_line_value = credits.rows.reduce((total, row) => {
    summary.transactions.push(row)
    return total + row.charge_value
  }, 0)

  // summarize debits at customer level (excluding new licences)
  const invoiceStmt = `SELECT ${attrs} FROM transactions WHERE ${where} AND charge_value >= 0 AND new_licence = false`
  const debits = await db.query(invoiceStmt, values)

  summary.debit_line_count = debits.rowCount
  summary.debit_line_value = debits.rows.reduce((total, row) => {
    summary.transactions.push(row)
    // summary.transactions.push({ id: row.id, charge_value: row.charge_value, line_attr_1: row.line_attr_1 })
    return total + row.charge_value
  }, 0)

  // new licences / minimum charge - handled at licence level
  const newLicStmt = `SELECT DISTINCT line_attr_1 FROM transactions WHERE ${where} AND new_licence=true`
  const newLicences = await db.query(newLicStmt, values)

  if (newLicences.rowCount > 0) {
    for (const row of newLicences.rows) {
      const licence = row.line_attr_1
      const creditNewStmt = `SELECT ${attrs} FROM transactions WHERE ${where} AND charge_value < 0 AND line_attr_1='${licence}'`
      const newCredits = await db.query(creditNewStmt, values)
      // console.log(`newCredits count: ${newCredits.rowCount}`)
      if (newCredits.rowCount > 0) {
        // we have some new licences / transfers so minimum charge rules apply
        const creditValue = newCredits.rows.reduce((total, row) => {
          summary.transactions.push(row)
          return total + row.charge_value
        }, 0)

        // console.log(`Credit value: ${creditValue}`)
        const amount = -config.minimumChargeAmount - creditValue
        // console.log(`Amount is: ${amount}`)
        // if (creditValue > -config.minimumChargeAmount) {
        if (amount < 0) {
          const transaction = await addMinimumChargeAdjustment(db, regime, billRun, newCredits.rows[0].id, amount, attrs)
          summary.transactions.push(transaction)
          summary.credit_line_count++
          summary.credit_line_value += amount
          // console.log(`add min charge credit row for: ${amount}`)
        }
        summary.credit_line_count += newCredits.rowCount
        summary.credit_line_value += creditValue
      }

      const invoiceNewStmt = `SELECT ${attrs} FROM transactions WHERE ${where} AND charge_value >= 0 AND line_attr_1='${licence}'`
      const newDebits = await db.query(invoiceNewStmt, values)
      // console.log(`newDebits count: ${newDebits.rowCount}`)
      if (newDebits.rowCount > 0) {
        // we have some new licences / transfers so minimum charge rules apply
        const debitValue = newDebits.rows.reduce((total, row) => {
          summary.transactions.push(row)
          return total + row.charge_value
        }, 0)
        // console.log(`Debit value: ${debitValue}`)
        // console.log(`Config value: ${config.minimumChargeAmount}`)
        const amount = config.minimumChargeAmount - debitValue
        // if (debitValue < config.minimumChargeAmount) {
        if (amount > 0) {
          // console.log(`add min charge debit row for: ${amount}`)
          const transaction = await addMinimumChargeAdjustment(db, regime, billRun, newDebits.rows[0].id, amount, attrs)
          summary.transactions.push(transaction)
          summary.debit_line_count++
          summary.debit_line_value += amount
          // console.log(`add min charge debit row for: ${amount}`)
        }
        summary.debit_line_count += newDebits.rowCount
        summary.debit_line_value += debitValue
      }
    }
  }

  // const creditStmt = `SELECT ${attrs} FROM transactions WHERE ${where} AND charge_value < 0 AND new_licence = false`
  // const creditNewStmt = `SELECT ${attrs} FROM transactions WHERE ${where} AND charge_value < 0 AND new_licence = true`
  // const invoiceStmt = `SELECT ${attrs} FROM transactions WHERE ${where} AND charge_value >= 0 AND new_licence = false`
  // const invoiceNewStmt = `SELECT ${attrs} FROM transactions WHERE ${where} AND charge_value >= 0 AND new_licence = true`
  // const creditStmt = `SELECT id,charge_value,line_attr_1 FROM transactions WHERE ${where} AND charge_value < 0`
  // const invoiceStmt = `SELECT id,charge_value,line_attr_1 FROM transactions WHERE ${where} AND charge_value >= 0`

  summary.net_total = summary.credit_line_value + summary.debit_line_value

  // NOTE: this is outside of the database transaction so won't rollback if there's an issue
  // if (finalise) {
  //   const transactionType = (summary.net_total < 0 ? 'C' : 'I')
  //   const transactionRef = await billRun.generateTransactionRef(transactionType === 'C')
  //   const upd = `UPDATE transactions SET transaction_type='${transactionType}',transaction_reference='${transactionRef}' WHERE ${where}`
  //   await db.query(upd, values)
  // }

  return summary
}

// async function updateTransactions (db, billRun, filter) {
//   // update all included transactions with an association to the billRun
//   // and change their status so they aren't visible in the billing queue
//   const dateNow = utils.formatDate(new Date())
//   const { where, values } = utils.buildWhereClause(filter)
//   const upd = `UPDATE transactions SET status='billed', transaction_date='${dateNow}', header_attr_1='${dateNow}' WHERE ${where}`
//   return db.query(upd, values)
// }

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
  // Object.keys(params).forEach((k) => {
  //   names.push(k)
  //   values.push(`$${attrCount++}`)
  //   data.push(params[k])
  // })

  const stmt = `INSERT INTO transactions (${names.join(',')}) VALUES (${values.join(',')}) RETURNING ${returnAttrs}`
  const result = await db.query(stmt, data)
  return result.rows[0]
}

module.exports = {
  call
}
