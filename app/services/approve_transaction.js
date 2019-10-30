const Boom = require('@hapi/boom')
const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')

// approve transaction in transaction queue for billing
async function call (regime, id) {
  // postgres explodes if we don't pass a valid uuid in a query
  if (!utils.isValidUUID(id)) {
    throw Boom.badRequest(`Invalid transaction id: '${id}'`)
  }

  const stmt = 'SELECT * FROM transactions WHERE id=$1::uuid AND regime_id=$2::uuid'
  let result = await pool.query(stmt, [id, regime.id])
  if (result.rowCount !== 1) {
    // not found
    throw Boom.notFound(`Transaction Id '${id}' not found`)
  }

  const transaction = result.rows[0]
  if (transaction.status !== 'unbilled') {
    // invalid state
    throw Boom.badData('Only unbilled transactions can be approved')
  }

  if (transaction.approved_for_billing) {
    // already approved
    throw Boom.badData('Transaction is already approved')
  }

  if (transaction.charge_value === null) {
    // no charge calculated
    throw Boom.badData('Transaction has no charge')
  }

  // TODO: other transaction validation/required attrs here

  const upd = 'UPDATE transactions SET approved_for_billing=true WHERE id=$1::uuid'
  result = await pool.query(upd, [id])
  if (result.rowCount !== 1) {
    throw Boom.internal('Failed to update transaction record')
  }

  return true
}

module.exports = {
  call
}
