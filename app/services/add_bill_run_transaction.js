const Boom = require('@hapi/boom')
const AddTransaction = require('./add_transaction')

// Add a new transaction record to the queue
async function call (regime, billRun, transaction, schema) {
  if (billRun.isSent) {
    throw Boom.badRequest('Cannot add transactions to sent Bill Run')
  }

  if (transaction.region !== billRun.region) {
    throw Boom.badData('Transaction region does not match BillRun region')
  }

  transaction.bill_run_id = billRun.id
  transaction.bill_run_number = billRun.bill_run_number

  const result = await AddTransaction.call(regime, transaction, schema)

  if (result !== 0) {
    // not a zero charge
    // invalidate any cached summary for the bill run
    await billRun.invalidateCache()
  }

  return result
}

module.exports = {
  call
}
