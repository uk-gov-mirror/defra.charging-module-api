const Boom = require('@hapi/boom')
const GenerateBillRunSummary = require('./generate_bill_run_summary')
const utils = require('../lib/utils')
// const { pool } = require('../lib/connectors/db')
const DBTransaction = require('../lib/db_transaction')
const config = require('../../config/config')

// Send a pre-sroc billRun
async function call (regime, billRun) {
  // recreate summary if necessary
  // assign transactions references and C/I flags
  // update status on billRun and transactions
  // return summary with filename

  // billRun cannot be already billed (or pending)
  if (billRun.isSent) {
    throw Boom.badRequest('Cannot send a Bill Run that has been billed')
  }

  // billRun must be approved
  if (!billRun.isApproved) {
    throw Boom.badRequest('Bill Run must be approved before it is sent')
  }

  // check that all transactions have been approved - should always be the case but possible to do this
  const valid = await billRun.checkTransactionsApproved()
  if (!valid) {
    throw Boom.badRequest('Not all transactions in the Bill Run have been approved')
  }

  // If the bill run is currently generating the summary then immediately return a holding response
  if (billRun.isGeneratingSummary) {
    return billRun.holdingResponse
  }

  // If the bill run has no summary data then we need to generate it
  // We race two promises and return the holding response if the timeout promise resolves first
  // This avoids timeout errors by returning a holding response if summary generation is taking too long
  if (!billRun.summary_data) {
    const result = await Promise.race([
      generateSummaryPromise(regime, billRun),
      timeoutPromise(config.billRunSummaryTimeout)
    ])

    // If result is false then the timeout came first so return the holding response
    if (!result) {
      return billRun.holdingResponse
    }

    // Otherwise, update billRun to the result of generateSummaryPromise
    billRun = result
  }

  // If we get here then the bill run is ready to be sent, so update the bill run and return it
  return updateBillRun(billRun)
}

async function updateBillRun (billRun) {
  const db = new DBTransaction()

  try {
    await db.begin()
    // parse up existing summary and apply transaction refs etc.
    // excluding zero value and deminimis transactions
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
        // Don't generate a transaction reference if this is deminimis or zero value invoice
        const generateRef = !s.deminimis && !s.net_zero_value_invoice
        const tRef = generateRef ? await billRun.generateTransactionRef(tType === 'C') : null
        const tIds = s.transactions.map(t => t.id).join("','")
        if (tIds) {
          const stmt = 'UPDATE transactions SET transaction_type=$1,transaction_reference=$2' +
            `WHERE id IN ('${tIds}') AND deminimis=FALSE AND net_zero_value_invoice=FALSE AND charge_value!=0`
          await db.query(stmt, [tType, tRef])
        }
      }
    }

    let fileRef, fileName

    // Zero charge-only bill runs are not exported so no file reference should be generated
    if (!billRun.isOnlyZeroCharge) {
      fileRef = await billRun.generateFileId()
      fileName = billRun.filename
    }

    const dateNow = utils.formatDate(new Date())
    const updBillRun = 'UPDATE bill_runs SET status=\'pending\',file_reference=$1,transaction_filename=$2 WHERE id=$3'
    await db.query(updBillRun, [fileRef, fileName, billRun.id])
    // update our local object
    billRun.status = 'pending'

    const updTrans = `UPDATE transactions SET status='pending', transaction_date='${dateNow}', header_attr_1='${dateNow}'` +
      'WHERE bill_run_id=$1 AND deminimis=FALSE AND net_zero_value_invoice=FALSE AND charge_value!=0'
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

// Generate summary and return it once completed
async function generateSummaryPromise (regime, billRun) {
  return new Promise((resolve, reject) => {
    (async () => {
      await GenerateBillRunSummary.call(regime, billRun)
      resolve(billRun)
    })().catch((error) => {
      reject(error)
    })
  })
}

// Return false after a set time
async function timeoutPromise (timeout) {
  return new Promise(resolve => {
    setTimeout(() => resolve(false), timeout)
  })
}

module.exports = {
  call
}
