const Boom = require('@hapi/boom')
const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')
const Schema = require('../schema')

async function call (regime, id) {
  // postgres explodes if we don't pass a valid uuid in a query
  if (!utils.isValidUUID(id)) {
    throw Boom.badRequest(`Invalid transaction id: '${id}'`)
  }

  const schema = Schema[regime.slug]
  // const transactions = require(`../schema/${regime.slug}_transaction`)

  const stmt = `${schema.transactionQuery()} WHERE id=$1 AND regime_id=$2`
  const result = await pool.query(stmt, [id, regime.id])

  if (result.rowCount !== 1) {
    throw Boom.notFound(`No transaction found with id '${id}'`)
  }

  return result.rows[0]
}

module.exports = {
  call
}
