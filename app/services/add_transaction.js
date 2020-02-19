const { pool } = require('../lib/connectors/db')
const CalculateCharge = require('./calculate_charge')

// Add a new transaction record to the queue
async function call (regime, transaction, schema) {
  // extract charge request params from the transaction data
  const charge = transaction.charge

  // calculate the charge
  const calc = await CalculateCharge.call(regime, charge, schema)

  if (calc.chargeValue === 0) {
    // indicate zero value charge calculated and abandon transaction
    return 0
  }

  // set charge calculation data
  transaction.setCalculation(calc)

  return save(regime, transaction)
}

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
