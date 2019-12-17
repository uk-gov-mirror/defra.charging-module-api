const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')

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
    this.net_total = 0

    if (params) {
      Object.assign(this, params)
    }
  }

  get isUnbilled () {
    return this.status === 'unbilled'
  }

  get isBilled () {
    return this.status === 'billed'
  }

  static build (regimeId, params) {
    return new this(regimeId, params)
  }

  static translate (data) {
    throw new Error('You need to override "translate" in a subclass')
  }

  static async find (regimeId, billRunId) {
    const stmt = 'select * from bill_runs where id=$1::uuid and regime_id=$2::uuid'
    const result = await pool.query(stmt, [billRunId, regimeId])
    if (result.rowCount !== 1) {
      return null
    }
    return this.build(regimeId, result.rows[0])
  }

  static async findRaw (regimeId, billRunId) {
    const stmt = this.rawQuery + ` WHERE id=$1::uuid AND regime_id=$2::uuid`
    const result = await pool.query(stmt, [billRunId, regimeId])
    if (result.rowCount !== 1) {
      return null
    }
    return result.rows[0]
  }

  static async search (params, page, perPage, sort, sortDir) {
    // paginated search returning collection of DB records (not class instances)
    const pagination = utils.validatePagination(page, perPage)

    const offset = (pagination.page - 1) * pagination.perPage
    const limit = pagination.perPage

    const select = this.rawQuery

    // where clause uses DB names not mapped names
    const where = []
    const values = []
    let attrCount = 1

    Object.keys(params).forEach(col => {
      if (col) {
        let val = params[col]
        if (val && val.indexOf('*') !== -1) {
          val = val.replace(/\*/g, '%')
          where.push(`${col} like $${attrCount++}`)
        } else {
          where.push(`${col} = $${attrCount++}`)
        }
        values.push(val)
      }
    })

    const whr = where.join(' AND ')
    // order clause uses mapped names
    const order = this.orderSearchQuery(sort, sortDir)
    const promises = [
      pool.query('SELECT count(*) FROM bill_runs WHERE ' + whr, values),
      pool.query(select + ' WHERE ' +
        whr + ' ORDER BY ' + order.join(',') + ` OFFSET $${attrCount++} LIMIT $${attrCount++}`,
      [...values, offset, limit])
    ]

    const results = await Promise.all(promises)
    const count = parseInt(results[0].rows[0].count)
    const pageTotal = Math.ceil(count / limit)
    const rows = results[1].rows

    pagination.pageCount = pageTotal
    pagination.recordCount = count

    return {
      pagination,
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
