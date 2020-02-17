const { formatDate } = require('../../../lib/utils')

class WRLSCustomerFilePresenter {
  constructor (customerFile) {
    this.customerFile = customerFile
    this.sequenceNumber = 0
  }

  get filename () {
    return this.customerFile.filename
  }

  get region () {
    return this.customerFile.region
  }

  get fileId () {
    return this.customerFile.fileId
  }

  get fileDate () {
    return formatDate(this.customerFile.updated_at)
  }

  handlePostcodeValue (value) {
    if (value && value.trim().length) {
      return value
    } else {
      return '.'
    }
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
      t.customer_name,
      t.address_line_1,
      t.address_line_2 || '',
      t.address_line_3 || '',
      t.address_line_4 || '',
      t.address_line_5 || '',
      t.address_line_6 || '',
      this.handlePostcodeValue(t.postcode)
    ].join('","')
    return `"${data}"\n`
  }

  async header (db, stream) {
    const data = [
      'H',
      this.nextSequenceNumber(),
      'NAL',
      this.region,
      'C',
      this.fileId,
      this.fileDate
    ].join('","')
    return stream.write(`"${data}"\n`)
  }

  async body (db, stream) {
    const stmt = 'SELECT * FROM customer_changes WHERE customer_file_id=$1::uuid ORDER BY customer_reference ASC'
    const result = await db.query(stmt, [this.customerFile.id])
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
      this.sequenceNumber
    ].join('","')
    return stream.write(`"${data}"\n`)
  }
}

module.exports = WRLSCustomerFilePresenter
