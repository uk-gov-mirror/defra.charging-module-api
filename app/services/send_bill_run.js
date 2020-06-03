const Boom = require('@hapi/boom')
const GenerateBillRunSummary = require('./generate_bill_run_summary')
const utils = require('../lib/utils')
// const { pool } = require('../lib/connectors/db')
const DBTransaction = require('../lib/db_transaction')

// Send a pre-sroc billRun
async function call (regime, billRun) {
  // recreate summary if necessary
  // assign transactions references and C/I flags
  // update status on billRun and transactions
  // return summary with filename

  // billRun cannot be already billed (or pending)
  if (billRun.isSent) {
    throw Boom.badRequest(`Cannot send a Bill Run that has been billed`)
  }

  // billRun must be approved
  if (!billRun.isApproved) {
    throw Boom.badRequest(`Bill Run must be approved before it is sent`)
  }

  // check that all transactions have been approved - should always be the case but possible to do this
  const valid = await billRun.checkTransactionsApproved()
  if (!valid) {
    throw Boom.badRequest('Not all transactions in the Bill Run have been approved')
  }

  if (!billRun.summary_data) {
    billRun = await GenerateBillRunSummary.call(regime, billRun)
  }

  const db = new DBTransaction()

  try {
    await db.begin()
    // parse up existing summary and apply transaction refs etc.
    // for each customer summary
    // - for each financial year
    // - - look at sign of net_total (determines C or I for group)
    // - - generate transaction reference using C/I
    // - - for each transaction
    // - - - set C/I flag
    // - - - set transaction ref
    // NOTE: cannot use forEach here as we need to call async fn
    for (const c of billRun.summary_data.customers) {
      for (const s of c.summary) {
        const tType = s.net_total < 0 ? 'C' : 'I'
        const tRef = await billRun.generateTransactionRef(tType === 'C')
        const tIds = s.transactions.map(t => t.id).join("','")
        const stmt = `UPDATE transactions SET transaction_type=$1,transaction_reference=$2 WHERE id IN ('${tIds}') AND deminimis=FALSE`
        await db.query(stmt, [tType, tRef])
      }
    }

    const fileRef = await billRun.generateFileId()
    const fileName = billRun.filename
    const dateNow = utils.formatDate(new Date())
    const updBillRun = `UPDATE bill_runs SET status='pending',file_reference=$1,transaction_filename=$2 WHERE id=$3`
    await db.query(updBillRun, [fileRef, fileName, billRun.id])
    // update our local object
    billRun.status = 'pending'

    const updTrans = `UPDATE transactions SET status='pending', transaction_date='${dateNow}', header_attr_1='${dateNow}' WHERE bill_run_id=$1 AND deminimis=FALSE`
    await db.query(updTrans, [billRun.id])
    await db.commit()
  } catch (err) {
    await db.rollback()
    throw err
  } finally {
    db.release()
  }

  return billRun
}

module.exports = {
  call
}
