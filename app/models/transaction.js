const Boom = require('@hapi/boom')
const { pool } = require('../lib/connectors/db')
const utils = require('../lib/utils')

class Transaction {
  constructor (params) {
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

  async approve () {
    if (!this.isUnbilled) {
      throw Boom.badData('Only unbilled transactions can be approved')
    }

    if (this.approved_for_billing) {
      throw Boom.badData('Transaction is already approved')
    }

    if (this.charge_value === null) {
      // should never be the case now ...
      throw Boom.badData('Transaction has no charge')
    }

    this.approved_for_billing = true
    const stmt = 'UPDATE transactions set approved_for_billing=true WHERE id=$1::uuid'
    const result = await pool.query(stmt, [this.id])
    if (result.rowCount !== 1) {
      throw Boom.internal('Failed to update transaction record')
    }
    return true
  }

  async unapprove () {
    if (!this.isUnbilled) {
      // invalid state
      throw Boom.badData('Only unbilled transactions can be unapproved')
    }

    if (!this.approved_for_billing) {
      // already unapproved/withheld
      throw Boom.badData('Transaction is already unapproved')
    }

    const stmt = 'UPDATE transactions SET approved_for_billing=false WHERE id=$1::uuid'
    const result = await pool.query(stmt, [this.id])
    if (result.rowCount !== 1) {
      throw Boom.internal('Failed to update transaction record')
    }

    return true
  }

  async remove () {
    if (!this.isUnbilled) {
      // invalid state
      throw Boom.badData('Only unbilled transactions can be removed')
    }

    // only remove the transaction if it hasn't been billed and belongs to the calling regime
    const stmt = 'DELETE FROM transactions WHERE id=$1::uuid AND regime_id=$2::uuid'
    const result = await pool.query(stmt, [this.id, this.regime_id])

    if (result.rowCount !== 1) {
      // didn't remove a transaction matching the criteria
      throw Boom.internal(`Unable to remove transaction [id '${this.id}']`)
    }

    return true
  }

  async reload () {
    const result = await pool.query('SELECT * FROM transactions WHERE id=$1::uuid', [this.id])
    Object.assign(this, result.rows[0])
    return result.rowCount
  }

  static build (params) {
    return new this(params)
  }

  static translate (data) {
    throw new Error('You need to override "translate" in a subclass')
  }

  static async find (regimeId, transactionId) {
    const stmt = 'select * from transactions where id=$1::uuid and regime_id=$2::uuid'
    const result = await pool.query(stmt, [transactionId, regimeId])
    if (result.rowCount !== 1) {
      return null
    }
    return this.build(result.rows[0])
  }

  static async findRaw (regimeId, transactionId) {
    const stmt = this.rawQuery + ` WHERE id=$1::uuid AND regime_id=$2::uuid`
    const result = await pool.query(stmt, [transactionId, regimeId])
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
      pool.query('SELECT count(*) FROM transactions WHERE ' + whr, values),
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
        transactions: rows
      }
    }
  }

  static orderSearchQuery (sort, sortDir) {
    // this should be overridden
    return [
      'customer_reference asc',
      'line_attr_1 asc'
    ]
  }

  static get rawQuery () {
    return 'select * from transactions'
  }
}

module.exports = Transaction
