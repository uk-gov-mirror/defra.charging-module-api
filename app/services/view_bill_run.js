const Boom = require('@hapi/boom')
const GenerateBillRunSummary = require('./generate_bill_run_summary')
const config = require('../../config/config')

async function call (request) {
  // retrieve billrun data
  const billRun = await request.model.find(request.regimeId, request.billRunId)
  if (!billRun) {
    throw Boom.notFound(`No BillRun found with id '${request.billRunId}'`)
  }

  // If the bill run is currently generating the summary then immediately return a holding response
  if (billRun.isGeneratingSummary) {
    return billRun.holdingResponse
  }

  // If the bill run already has a summary then return it
  if (billRun.summary_data) {
    // pull out either customer summary or licence
    return billRun.summary(request.searchParams)
  }

  // Otherwise, the bill run has no summary data so we need to generate it
  // We race two promises and return whichever finishes first
  // This avoids timeout errors by returning a holding response if summary generation is taking too long
  return Promise.race([
    generateSummaryPromise(request, billRun),
    summaryTimeoutPromise(billRun, config.billRunSummaryTimeout)
  ])
}

// Generate summary and return it once completed
async function generateSummaryPromise (request, billRun) {
  return new Promise((resolve, reject) => {
    (async () => {
      await GenerateBillRunSummary.call(request.regime, billRun)
      resolve(billRun.summary(request.searchParams))
    })().catch((error) => {
      reject(error)
    })
  })
}

// Return holding summary after a set time
async function summaryTimeoutPromise (billRun, timeout) {
  return new Promise(resolve => {
    setTimeout(() => resolve(billRun.holdingResponse), timeout)
  })
}

module.exports = {
  call
}
