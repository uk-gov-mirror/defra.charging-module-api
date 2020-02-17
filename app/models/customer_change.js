const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')

class CustomerChange {
  constructor (params) {
    if (params) {
      Object.assign(this, params)
    }
  }

  get isExported () {
    return this.status === 'exported'
  }

  async reload () {
    const result = await pool.query('SELECT * FROM customer_changes WHERE id=$1::uuid', [this.id])
    Object.assign(this, result.rows[0])
    return result.rowCount
  }

  static build (params) {
    return new this(params)
  }

  static async find (regimeId, customerChangeId) {
    const stmt = 'select * from customer_changes where id=$1::uuid and regime_id=$2::uuid'
    const result = await pool.query(stmt, [customerChangeId, regimeId])
    if (result.rowCount !== 1) {
      return null
    }
    return this.build(result.rows[0])
  }

  static async findRaw (regimeId, customerChangeId) {
    const stmt = this.rawQuery + ` WHERE id=$1::uuid AND regime_id=$2::uuid`
    const result = await pool.query(stmt, [customerChangeId, regimeId])
    if (result.rowCount !== 1) {
      return null
    }
    return result.rows[0]
  }

  static async search (params, page, perPage, sort, sortDir) {
    // paginated search returning collection of DB records (not class instances)
    // const pagination = {
    //   page: page || config.pagination.page,
    //   perPage: perPage || config.pagination.perPage
    // }
    const pagination = utils.validatePagination(page, perPage)

    const offset = (pagination.page - 1) * pagination.perPage
    const limit = pagination.perPage

    // build where clause
    // regime name, database name
    // const transactions = require(`../schema/${regime.slug}_transaction`)
    // const schema = Schema[regime.slug]
    const select = this.rawQuery

    // where clause uses DB names not mapped names
    const where = []
    const values = []
    let attrCount = 1

    Object.keys(params).forEach(col => {
      if (col) {
        const val = params[col]

        if (val && val.indexOf('%') !== -1) {
          where.push(`${col} like $${attrCount++}`)
        } else {
          where.push(`${col}=$${attrCount++}`)
        }
        // if (val && val.indexOf('*') !== -1) {
        //   val = val.replace(/\*/g, '%')
        //   where.push(`${col} like $${attrCount++}`)
        // } else {
        //   where.push(`${col} = $${attrCount++}`)
        // }
        values.push(val)
      }
    })

    const whr = where.join(' AND ')
    // order clause uses mapped names
    const order = this.orderSearchQuery(sort, sortDir)
    const promises = [
      pool.query('SELECT count(*) FROM customer_changes WHERE ' + whr, values),
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
        customerChanges: rows
      }
    }
  }

  static orderSearchQuery (sort, sortDir) {
    // this should be overridden
    return [
      'customer_reference asc',
      'customer_name asc'
    ]
  }

  static get rawQuery () {
    return 'select * FROM customer_changes'
  }
}

module.exports = CustomerChange
