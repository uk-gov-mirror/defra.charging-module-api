const Boom = require('@hapi/boom')

// Add a new transaction record to the queue
async function call (regime, billRun, transaction) {
  if (billRun.isBilled) {
    throw Boom.badRequest('Cannot remove transactions from a sent Bill Run')
  }

  if (transaction.bill_run_id !== billRun.id) {
    throw Boom.notFound('BillRun does not contain this Transaction')
  }

  if (transaction.minimum_charge_adjustment) {
    throw Boom.badRequest('Cannot remove a minimum charge adjustment')
  }

  const result = await transaction.remove()

  if (result) {
    // invalidate any cached summary for the bill run
    // await billRun.invalidateCache()
    // await billRun.removeAdjustmentsForLicence(transaction.licenceNumber)
    await Promise.all([
      billRun.invalidateCache(),
      billRun.removeAdjustmentsForLicence(transaction.licenceNumber)
    ])
  }

  return result
}
module.exports = {
  call
}
