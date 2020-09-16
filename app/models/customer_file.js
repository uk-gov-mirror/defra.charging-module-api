const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')

class CustomerFile {
  constructor (regimeId, params) {
    this.regimeId = regimeId
    this.changes = null
    if (params) {
      Object.assign(this, params)
    }
  }

  get isExported () {
    return this.status === 'exported'
  }

  async setExported (db) {
    const result = await db.query('UPDATE customer_files SET status=\'exported\' WHERE id=$1::uuid', [this.id])
    if (result.rowCount !== 1) {
      throw new Error('Could not update CustomerFile status to exported')
    }
    this.status = 'exported'
    return 1
  }

  async save (db) {
    const stmt = `
      INSERT INTO customer_files (
        regime_id, region, file_reference
      ) VALUES (
        '${this.regimeId}', '${this.region}', '${this.file_reference}'
      ) RETURNING id`
    // if db supplied, the inside a transaction so use the db client
    // not the pool
    const cnx = db || pool
    const result = await cnx.query(stmt)

    if (result.rowCount !== 1) {
      throw new Error('Unable to save customer file')
    }
    this.id = result.rows[0].id
    return this.reload(db)
  }

  async reload (db) {
    const cnx = db || pool
    const result = await cnx.query('SELECT * FROM customer_files WHERE id=$1::uuid', [this.id])
    Object.assign(this, result.rows[0])
    return this
  }

  get prettyStatus () {
    switch (this.status) {
      case 'initialised':
        return 'Awaiting export'
      case 'exported':
        return 'Exported'
      default:
        throw new Error(`Unknown Customer File state: ${this.status}`)
    }
  }

  async loadChanges (db) {
    const cnx = db || pool
    const result = await cnx.query('SELECT customer_reference AS "customerReference" FROM customer_changes WHERE customer_file_id=$1::uuid', [this.id])
    this.changes = result.rows // .map(r => r.customer_reference)
    return result.rowCount
  }

  static build (regimeId, params) {
    return new this(regimeId, params)
  }

  static translate (data) {
    throw new Error('You need to override "translate" in a subclass')
  }

  static async find (regimeId, customerFileId, db) {
    const cnx = db || pool
    const stmt = 'select * from customer_files where id=$1::uuid and regime_id=$2::uuid'
    const result = await cnx.query(stmt, [customerFileId, regimeId])
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
      pool.query('SELECT count(*) FROM customer_files WHERE ' + whr, values),
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
        customerFiles: rows
      }
    }
  }

  static get rawQuery () {
    return 'select * from customer_files'
  }
}

module.exports = CustomerFile
