const Boom = require('@hapi/boom')
const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')
const Schema = require('../schema')

async function call (regime, id) {
  // postgres explodes if we don't pass a valid uuid in a query
  if (!utils.isValidUUID(id)) {
    throw Boom.badRequest(`Invalid transaction id: '${id}'`)
  }

  const stmt = 'select pre_sroc from transactions where id=$1::uuid AND regime_id=$2::uuid'
  const result = await pool.query(stmt, [id, regime.id])

  if (result.rowCount !== 1) {
    throw Boom.notFound(`No transaction found with id '${id}'`)
  }

  const Transaction = Schema.preSroc[regime.slug].Transaction

  // we don't need an object just the database result (transformed to the correct naming)
  return Transaction.findRaw(regime.id, id)
}

module.exports = {
  call
}
