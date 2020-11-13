const { pool } = require('../lib/connectors/db')

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
}

module.exports = CustomerChange
