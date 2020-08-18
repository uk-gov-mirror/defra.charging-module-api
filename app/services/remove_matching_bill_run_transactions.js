const Boom = require('@hapi/boom')
const { pool } = require('../lib/connectors/db')

// Add a new transaction record to the queue
async function call (request) {
  if (request.billRun.isBilled) {
    throw Boom.badRequest('Cannot remove transactions from a sent Bill Run')
  }

  const { where, values } = request.whereClause
  const whr = where.join(' AND ')

  const stmt = `DELETE FROM transactions WHERE ${whr}`
  const result = await pool.query(stmt, values)

  if (result.rowCount > 0) {
    // invalidate any cached summary for the bill run
    await request.billRun.invalidateCache()
    // any minimum charge adjustments should match search for licence or customer
    // so we shouldn't have anything extra to delete here
  }

  return result.rowCount
}
module.exports = {
  call
}
