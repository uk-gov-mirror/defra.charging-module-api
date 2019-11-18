const Boom = require('@hapi/boom')
const { pool } = require('../lib/connectors/db')
const CalculateCharge = require('./calculate_charge')

// Add a new transaction record to the queue
async function call (regime, schema, attrs, preSroc) {
  // extract charge params from the transaction data
  const chargeParams = schema.extractChargeParams(attrs)

  // translate charge params into rule engine schema
  const chargeData = schema.translateCharge(chargeParams)

  // calculate charge
  const charge = await CalculateCharge.call(regime, schema, chargeData)
  if (charge.calculation.messages) {
    throw Boom.badData(charge.calculation.messages)
  }

  // translate calculation elements from rules schema to regime schema
  // const transCalc = schema.translateCalculation(charge.calculation)

  // add translated charge data to transaction
  // const combinedData = Object.assign(attrs, transCalc)
  const transaction = schema.buildTransactionRecord(attrs, charge)
  // translate regime naming scheme into DB schema
  // const transData = schema.translateTransaction(combinedData)

  // set sroc flag correctly
  // transData.pre_sroc = preSroc

  // populate calculation json and charge values
  // const transaction = addChargeDataToTransaction(transData, charge)

  return save(regime, transaction)
}

// function addChargeDataToTransaction (transaction, charge) {
//   const chargeValue = charge.chargeValue
//   transaction.charge_value = chargeValue
//   transaction.currency_line_amount = chargeValue
//   transaction.unit_of_measure_price = chargeValue
//   transaction.charge_calculation = charge
//   return transaction
// }

// Assumes at this point that the attrs are in DB naming scheme
async function save (regime, transaction) {
  const names = []
  const values = []
  const data = []
  let attrCount = 1

  // add the association with the regime
  transaction.regime_id = regime.id

  Object.keys(transaction).forEach((k) => {
    names.push(k)
    values.push(`$${attrCount++}`)
    data.push(transaction[k])
  })

  const stmt = `INSERT INTO transactions (${names.join(',')}) VALUES (${values.join(',')}) RETURNING id`
  const result = await pool.query(stmt, data)
  return result.rows[0].id
}

module.exports = {
  call
}
