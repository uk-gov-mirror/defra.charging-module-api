const { pool } = require('../lib/connectors/db')

class BillRun {
  constructor (regimeId, params) {
    this.regimeId = regimeId
    this.credit_count = 0
    this.credit_value = 0
    this.invoice_count = 0
    this.invoice_value = 0
    this.credit_line_count = 0
    this.credit_line_value = 0
    this.debit_line_count = 0
    this.debit_line_value = 0
    this.zero_value_line_count = 0
    this.net_total = 0
    this.filter = {}
    this.summary_data = null

    if (params) {
      Object.assign(this, params)
    }
  }

  get isUnbilled () {
    return this.status !== 'billed'
  }

  get isBilled () {
    return this.status === 'billed'
  }

  get isApproved () {
    return this.approved_for_billing
  }

  get isSent () {
    return this.status === 'pending' || this.status === 'billed' || this.status === 'billing_not_required'
  }

  // Return true if the bill run only contains zero value transactions
  get isOnlyZeroCharge () {
    return Boolean(!this.credit_line_count && !this.debit_line_count && this.zero_value_line_count)
  }

  async billed (db) {
    const result = await db.query('UPDATE bill_runs SET status=\'billed\',file_created_at=NOW() WHERE id=$1::uuid', [this.id])
    if (result.rowCount !== 1) {
      throw new Error('Could not update BillRun status to billed')
    }
    const tResult = await db.query('UPDATE transactions SET status=\'billed\' WHERE bill_run_id=$1::uuid', [this.id])
    if (tResult.rowCount < 1) {
      throw new Error('Could not update transaction status to billed')
    }
    return 1
  }

  async billingNotRequired (db) {
    const result = await db.query('UPDATE bill_runs SET status=\'billing_not_required\' WHERE id=$1::uuid', [this.id])
    if (result.rowCount !== 1) {
      throw new Error('Could not update BillRun status to billing_not_required')
    }
    const tResult = await db.query('UPDATE transactions SET status=\'billing_not_required\' WHERE bill_run_id=$1::uuid', [this.id])
    if (tResult.rowCount < 1) {
      throw new Error('Could not update transaction status to billing_not_required')
    }
    return 1
  }

  async invalidateCache () {
    // something has been updated and we need to remove the cached summary
    const stmt = `
      UPDATE bill_runs SET
      credit_count = 0,
      credit_value = 0,
      invoice_count = 0,
      invoice_value = 0,
      credit_line_count = 0,
      credit_line_value = 0,
      debit_line_count = 0,
      debit_line_value = 0,
      zero_value_line_count = 0,
      net_total = 0,
      summary_data = NULL
      WHERE id=$1::uuid
    `
    const result = await pool.query(stmt, [this.id])

    return result.rowCount
  }

  async removeAdjustmentsForLicence (licenceNumber) {
    // called when transaction added or removed
    const delStmt = `DELETE FROM transactions
     WHERE bill_run_id=$1::uuid
     AND minimum_charge_adjustment=true
     AND line_attr_1=$2`

    const result = await pool.query(delStmt, [this.id, licenceNumber])
    return result.rowCount
  }

  async addCustomerFile (customerFile) {
    this.customer_file_id = customerFile.id
    this.customer_filename = customerFile.filename
    const result = await pool.query(
      `UPDATE bill_runs SET
       customer_file_id=$1,
       customer_filename=$2
       WHERE id=$3`,
      [this.customer_file_id, this.customer_filename, this.id])
    if (result.rowCount !== 1) {
      throw new Error('Could not associate CustomerFile with BillRun')
    }
    return 1
  }

  async checkTransactionsApproved () {
    const stmt = 'SELECT count(*)::int FROM transactions WHERE bill_run_id=$1::uuid AND approved_for_billing=false'
    const result = await pool.query(stmt, [this.id])
    return result.rows[0].count === 0
  }

  async save (db) {
    const stmt = `
      UPDATE bill_runs SET
        file_reference=${this.fileId},
        transaction_filename=$1,
        credit_count=${this.credit_count},
        credit_value=${this.credit_value},
        invoice_count=${this.invoice_count},
        invoice_value=${this.invoice_value},
        credit_line_count=${this.credit_line_count},
        credit_line_value=${this.credit_line_value},
        debit_line_count=${this.debit_line_count},
        debit_line_value=${this.debit_line_value},
        zero_value_line_count=${this.zero_value_line_count},
        net_total=${this.net_total},
        summary_data=$2
      WHERE id='${this.id}' AND regime_id='${this.regime_id}'
    `

    // if db supplied, the inside a transaction so use the db client
    // not the pool
    const cnx = db || pool
    const result = await cnx.query(stmt, [this.filename, this.summary_data])

    if (result.rowCount !== 1) {
      throw new Error('Unable to save bill run')
    }
    return true
  }

  async remove () {
    // removes all associated transactions (cascade delete)
    if (this.id) {
      const stmt = 'DELETE FROM bill_runs WHERE id=$1::uuid'
      const result = await pool.query(stmt, [this.id])
      return result.rowCount
    }
    return 0
  }

  static build (regimeId, params) {
    return new this(regimeId, params)
  }

  static translate (data) {
    throw new Error('You need to override "translate" in a subclass')
  }

  static async find (regimeId, billRunId, db) {
    const cnx = db || pool
    const stmt = 'select * from bill_runs where id=$1::uuid and regime_id=$2::uuid'
    const result = await cnx.query(stmt, [billRunId, regimeId])
    if (result.rowCount !== 1) {
      return null
    }
    return this.build(regimeId, result.rows[0])
  }

  static async findRaw (regimeId, billRunId) {
    const stmt = this.rawQuery + ' WHERE id=$1::uuid AND regime_id=$2::uuid'
    const result = await pool.query(stmt, [billRunId, regimeId])
    if (result.rowCount !== 1) {
      return null
    }
    return result.rows[0]
  }

  static async search (searchRequest, db) {
    const select = this.rawQuery

    const cnx = db || pool

    // where clause uses DB names not mapped names
    const where = []
    const values = []
    let attrCount = 1

    const params = searchRequest.searchParams

    Object.keys(params).forEach(col => {
      if (col) {
        const val = params[col]
        if (val && typeof val === 'string' && val.indexOf('%') !== -1) {
          where.push(`${col} like $${attrCount++}`)
        } else {
          where.push(`${col} = $${attrCount++}`)
        }
        values.push(val)
      }
    })

    const whr = where.join(' AND ')
    const order = this.orderSearchQuery(searchRequest.sort, searchRequest.sortDir)
    const stmt = `${select} WHERE ${whr} ORDER BY ${order.join(',')} OFFSET $${attrCount++} LIMIT $${attrCount++}`
    const promises = [
      cnx.query(`SELECT count(*) FROM bill_runs WHERE ${whr}`, values),
      cnx.query(stmt, [...values, searchRequest.offset, searchRequest.limit])
    ]

    const results = await Promise.all(promises)
    const count = parseInt(results[0].rows[0].count)
    const pageTotal = Math.ceil(count / searchRequest.limit)
    const rows = results[1].rows

    return {
      pagination: {
        page: searchRequest.page,
        perPage: searchRequest.perPage,
        pageCount: pageTotal,
        recordCount: count
      },
      data: {
        billRuns: rows
      }
    }
  }

  static get rawQuery () {
    return 'select * from bill_runs'
  }
}

module.exports = BillRun
