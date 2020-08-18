const { pool } = require('../lib/connectors/db')
const SequenceCounter = require('../models/sequence_counter')

// Add a new pre-sroc billRun
async function call (request) {
  // TODO: decide if we should be checking that there are no drafts already presdent for the region

  const billRunNumber = await generateBillRunNumber(request.regimeId, request.region)

  const stmt = `INSERT INTO bill_runs (regime_id, region, bill_run_number, pre_sroc) VALUES ($1,$2,$3,true) RETURNING id`

  const result = await pool.query(stmt, [request.regimeId, request.region, billRunNumber])

  return {
    id: result.rows[0].id,
    billRunNumber
  }
}

async function generateBillRunNumber (regimeId, region) {
  const sequenceCounter = new SequenceCounter(regimeId, region)
  return sequenceCounter.nextBillRunNumber()
}

module.exports = {
  call
}
