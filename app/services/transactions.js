// transactions
const { pool } = require('../lib/connectors/db')

async function find (regime, id) {
  const transactions = require(`../schema/${regime.slug}_transaction`)

  const stmt = `${transactions.select()} WHERE id=$1 AND regime_id=$2`
  const result = await pool.query(stmt, [id, regime.id])

  if (result.rowCount === 1) {
    return result.rows[0]
  }
  return {
    error: `Transaction not found`
  }
}

module.exports = {
  find
}
