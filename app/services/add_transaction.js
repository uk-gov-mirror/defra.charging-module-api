const { pool } = require('../lib/connectors/db')

// Add a new transaction record to the queue
// Assumes at this point that the attrs are in DB naming scheme
async function call (regime, attrs) {
  const names = []
  const values = []
  const data = []
  let attrCount = 1

  // add the association with the regime
  attrs['regime_id'] = regime.id

  Object.keys(attrs).forEach((k) => {
    names.push(k)
    values.push(`$${attrCount++}`)
    data.push(attrs[k])
  })

  const stmt = `INSERT INTO transactions (${names.join(',')}) VALUES (${values.join(',')}) RETURNING id`
  const result = await pool.query(stmt, data)
  return result.rows[0].id
}

module.exports = {
  call
}
