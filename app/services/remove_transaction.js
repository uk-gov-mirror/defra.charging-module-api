const Boom = require('@hapi/boom')
const Transaction = require('../models/transaction')
const utils = require('../lib/utils')

// Remove a transaction from the queue
// The transaction will only be removed if it belongs to the given regime
// and has the 'unbilled' status.
async function call (regime, id) {
  // postgres explodes if we don't pass a valid uuid in a query
  if (!utils.isValidUUID(id)) {
    throw Boom.badRequest(`Invalid transaction id: '${id}'`)
  }

  const t = await Transaction.find(regime.id, id)

  if (t === null) {
    // didn't find a transaction matching the criteria
    throw Boom.notFound(`No transaction found with id '${id}'`)
  }

  // only remove the transaction if it hasn't been billed and belongs to the calling regime
  return t.remove()
}

module.exports = {
  call
}
