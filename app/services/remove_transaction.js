const Boom = require('@hapi/boom')
const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')

// Remove a transaction from the queue
// The transaction will only be removed if it belongs to the given regime
// and has the 'unbilled' status.
async function call (regime, id) {
  // postgres explodes if we don't pass a valid uuid in a query
  if (!utils.isValidUUID(id)) {
    throw Boom.badRequest(`Invalid transaction id: '${id}'`)
  }

  // only remove the transaction if it hasn't been billed and belongs to the calling regime
  const stmt = "DELETE FROM transactions WHERE id=$1::uuid AND regime_id=$2::uuid AND status='unbilled'"
  const result = await pool.query(stmt, [id, regime.id])

  if (result.rowCount !== 1) {
    // didn't remove a transaction matching the criteria
    throw Boom.notFound(`No queued transaction found with id '${id}'`)
  }

  return true
}

module.exports = {
  call
}
