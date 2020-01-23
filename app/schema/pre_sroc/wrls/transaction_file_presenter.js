const { formatDate } = require('../../../lib/utils')

class WRLSTransactionFilePresenter {
  constructor (billRun) {
    this.billRun = billRun
    this.sequenceNumber = 0
  }

  get filename () {
    return this.billRun.filename
  }

  get region () {
    return this.billRun.region
  }

  get fileId () {
    return this.billRun.fileId
  }

  get billRunId () {
    return this.billRun.billRunId
  }

  get fileDate () {
    return formatDate(this.billRun.updated_at)
  }

  get invoiceTotal () {
    return this.billRun.invoice_value
  }

  get creditTotal () {
    return this.billRun.credit_value
  }

  nextSequenceNumber () {
    const num = this.sequenceNumber++
    return `${('0000000' + num).slice(-7)}`
  }

  formatDetail (t) {
    const data = [
      'D',
      this.nextSequenceNumber(),
      t.customer_reference,
      formatDate(t.transaction_date),
      t.transaction_type,
      t.transaction_reference,
      '',
      'GBP',
      '',
      formatDate(t.header_attr_1), // invoice date
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      t.currency_line_amount,
      '',
      t.line_area_code,
      t.line_description,
      'A',
      '',
      t.line_attr_1,
      t.line_attr_2,
      t.line_attr_3,
      t.line_attr_4,
      t.line_attr_5,
      t.line_attr_6,
      t.line_attr_7,
      t.line_attr_8,
      t.line_attr_9,
      t.line_attr_10,
      '',
      '',
      t.line_attr_13,
      t.line_attr_14,
      '',
      '1',
      'Each',
      t.unit_of_measure_price
    ].join('","')
    return `"${data}"\n`
  }

  async header (db, stream) {
    const data = [
      'H',
      this.nextSequenceNumber(),
      'NAL',
      this.region,
      'I',
      this.fileId,
      this.billRunId,
      this.fileDate
    ].join('","')
    return stream.write(`"${data}"\n`)
  }

  async body (db, stream) {
    const stmt = 'SELECT * FROM transactions WHERE bill_run_id=$1::uuid ORDER BY transaction_reference ASC, line_attr_1 ASC'
    const result = await db.query(stmt, [this.billRun.id])
    for (let n = 0; n < result.rowCount; n++) {
      const row = result.rows[n]
      stream.write(this.formatDetail(row))
    }
    return 0
  }

  async trailer (db, stream) {
    const seq = this.nextSequenceNumber()
    const data = [
      'T',
      seq,
      this.sequenceNumber,
      this.invoiceTotal,
      this.creditTotal
    ].join('","')
    return stream.write(`"${data}"\n`)
  }
}

module.exports = WRLSTransactionFilePresenter
