const { pool } = require('../../app/lib/connectors/db')

async function billRunCount () {
  const result = await pool.query('SELECT count(*)::int from bill_runs')
  return result.rows[0].count
}

async function cleanBillRuns () {
  return pool.query('DELETE from bill_runs')
}

module.exports = {
  billRunCount,
  cleanBillRuns
}
