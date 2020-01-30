const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')

// generate a new billrun and return a summary
async function call (removalRequest) {
  // transactions to be approved will always have:
  //   regime_id = approvalRequest.regimeId
  //   status = unbilled
  //   region = approvalRequest.region
  // optionally further restricted by approvalRequest.filter
  //
  const defaultArgs = {
    regime_id: removalRequest.regimeId,
    status: 'unbilled',
    region: removalRequest.region
  }

  const filter = { ...removalRequest.filter, ...defaultArgs }

  const { where, values } = utils.buildWhereClause(filter)

  const stmt = `DELETE FROM transactions WHERE ${where}`
  const result = await pool.query(stmt, values)

  return {
    removedCount: result.rowCount
  }
}

module.exports = {
  call
}
