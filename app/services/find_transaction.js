const Boom = require('@hapi/boom')
const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')
const Schema = require('../schema')

async function call (regime, id) {
  // postgres explodes if we don't pass a valid uuid in a query
  if (!utils.isValidUUID(id)) {
    throw Boom.badRequest(`Invalid transaction id: '${id}'`)
  }

  // we need to know whether this is a pre or post sroc transaction
  // in order to correctly map the column names
  let stmt = 'select pre_sroc from transactions where id=$1 AND regime_id=$2'
  let result = await pool.query(stmt, [id, regime.id])

  if (result.rowCount !== 1) {
    throw Boom.notFound(`No transaction found with id '${id}'`)
  }

  const isPreSroc = result.rows[0].pre_sroc
  const schema = Schema[isPreSroc ? 'preSroc' : 'sroc'][regime.slug]

  stmt = `${schema.transactionQuery()} WHERE id=$1 AND regime_id=$2`
  result = await pool.query(stmt, [id, regime.id])

  return result.rows[0]
}

module.exports = {
  call
}
