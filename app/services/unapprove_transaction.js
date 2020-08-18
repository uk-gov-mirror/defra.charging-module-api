const Boom = require('@hapi/boom')
const utils = require('../lib/utils')
const Transaction = require('../models/transaction')

// mark transaction as unapproved/withheld - only applicable to unbilled transactions
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

  return t.unapprove()
}

module.exports = {
  call
}
