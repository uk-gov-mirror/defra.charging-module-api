const Boom = require('@hapi/boom')
const utils = require('../lib/utils')
const Transaction = require('../models/transaction')

// approve transaction in transaction queue for billing
async function call (regime, id) {
  // postgres explodes if we don't pass a valid uuid in a query
  if (!utils.isValidUUID(id)) {
    throw Boom.badRequest(`Invalid transaction id: '${id}'`)
  }

  const t = await Transaction.find(regime.id, id)

  if (t === null) {
    // not found
    throw Boom.notFound(`Transaction Id '${id}' not found`)
  }

  return t.approve()
}

module.exports = {
  call
}
