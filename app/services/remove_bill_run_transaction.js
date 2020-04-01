const Boom = require('@hapi/boom')

// Add a new transaction record to the queue
async function call (regime, billRun, transaction) {
  if (billRun.isBilled) {
    throw Boom.badRequest('Cannot remove transactions from a sent Bill Run')
  }

  if (transaction.bill_run_id !== billRun.id) {
    throw Boom.notFound('BillRun does not contain this Transaction')
  }

  const result = await transaction.remove()

  if (result) {
    // invalidate any cached summary for the bill run
    await billRun.invalidateCache()
  }

  return result
}
module.exports = {
  call
}
