const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')

// generate a new billrun and return a summary
async function call (approvalRequest) {
  // transactions to be approved will always have:
  //   regime_id = approvalRequest.regimeId
  //   status = unbilled
  //   region = approvalRequest.region
  //   approved_for_billing = false
  // optionally further restricted by approvalRequest.filter
  //
  const defaultArgs = {
    regime_id: approvalRequest.regimeId,
    status: 'unbilled',
    region: approvalRequest.region,
    approved_for_billing: false
  }

  const filter = { ...approvalRequest.filter, ...defaultArgs }

  const { where, values } = utils.buildWhereClause(filter)

  const stmt = `UPDATE transactions SET approved_for_billing=true WHERE ${where}`
  const result = await pool.query(stmt, values)

  return {
    approvedCount: result.rowCount
  }
}

module.exports = {
  call
}
