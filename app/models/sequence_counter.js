const { pool } = require('../lib/connectors/db')

// Every region in every Regime requires 5 counters
// One SequenceCounter record per region
// A - Anglian
// B - Midlands
// E - South West
// N - North West
// S - Southern
// T - Thames
// W - Wales
// Y - North East

async function fetchNext (regimeId, region, name) {
  const stmt = `UPDATE sequence_counters SET ${name}=${name}+1 WHERE regime_id=$1::uuid AND region=$2 RETURNING ${name}`
  const result = await pool.query(stmt, [regimeId, region])

  if (result.rowCount !== 1) {
    throw new Error(`Failed to fetch sequence counter '${name}'`)
  }
  return result.rows[0][name]
}

class SequenceCounter {
  constructor (regimeId, region) {
    this.regimeId = regimeId
    this.region = region
  }

  async nextFileNumber () {
    return fetchNext(this.regimeId, this.region, 'file_number')
  }

  async nextTransactionNumber () {
    return fetchNext(this.regimeId, this.region, 'transaction_number')
  }

  async nextBillRunNumber () {
    return fetchNext(this.regimeId, this.region, 'bill_run_number')
  }

  async nextDraftTransactionNumber () {
    return fetchNext(this.regimeId, this.region, 'draft_transaction_number')
  }

  async nextDraftBillRunNumber () {
    return fetchNext(this.regimeId, this.region, 'draft_bill_run_number')
  }

  async nextCustomerFileNumber () {
    return fetchNext(this.regimeId, this.region, 'customer_file_number')
  }
}

module.exports = SequenceCounter
