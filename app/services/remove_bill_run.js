const Boom = require('@hapi/boom')
const BillRun = require('../models/bill_run')
const utils = require('../lib/utils')

// Remove a bill_run from the queue
// The bill_run will only be removed if it belongs to the given regime
// and does not have 'billed' status.
async function call (regime, id) {
  // postgres explodes if we don't pass a valid uuid in a query
  if (!utils.isValidUUID(id)) {
    throw Boom.badRequest(`Invalid bill_run id: '${id}'`)
  }

  const billRun = await BillRun.find(regime.id, id)

  if (billRun === null) {
    // didn't find a bill_run matching the criteria
    throw Boom.notFound(`No BillRun found with id '${id}'`)
  }

  // only remove the bill_run if it hasn't been billed
  if (billRun.isBilled) {
    throw Boom.badRequest(`Cannot remove BillRun because it has been billed`)
  }

  return billRun.remove()
}

module.exports = {
  call
}
