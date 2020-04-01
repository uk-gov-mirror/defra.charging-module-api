const Boom = require('@hapi/boom')
const BillRun = require('../models/bill_run')
const DBTransaction = require('../lib/db_transaction')
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

  // only update the bill_run if it hasn't been billed
  if (billRun.isBilled) {
    throw Boom.badRequest(`Cannot unapprove BillRun because it has been billed`)
  }

  const db = new DBTransaction()

  try {
    await db.begin()
    // unapprove all transactions in the bill run
    const stmt = 'UPDATE transactions SET approved_for_billing=false WHERE bill_run_id=$1::uuid'
    const up1 = await db.query(stmt, [billRun.id])
    // unapprove bill run
    const stmt2 = 'UPDATE bill_runs SET approved_for_billing=false WHERE id=$1::uuid'
    const up2 = await db.query(stmt2, [billRun.id])

    await db.commit()

    return {
      billRun: up2.rowCount,
      transactions: up1.rowCount
    }
  } catch (err) {
    await db.rollback()
    throw err
  } finally {
    await db.release()
  }
}

module.exports = {
  call
}
