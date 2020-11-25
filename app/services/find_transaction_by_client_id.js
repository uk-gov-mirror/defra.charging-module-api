const { pool } = require('../lib/connectors/db')

async function call (regime, clientId) {
  const stmt = 'SELECT id, client_id FROM transactions WHERE client_id=$1 AND regime_id=$2::uuid'
  const result = await pool.query(stmt, [clientId, regime.id])

  if (result.rowCount !== 1) {
    return null
  }

  return {
    id: result.rows[0].id,
    clientId: result.rows[0].client_id
  }
}

module.exports = {
  call
}
