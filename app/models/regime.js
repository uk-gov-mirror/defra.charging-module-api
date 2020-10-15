const { pool } = require('../lib/connectors/db')
const Schema = require('../schema')

class Regime {
  constructor (params) {
    if (params) {
      Object.assign(this, params)
    }
  }

  async reload () {
    const result = await pool.query('SELECT * FROM regimes WHERE id=$1::uuid', [this.id])
    Object.assign(this, result.rows[0])
    return result.rowCount
  }

  toJSON () {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug
    }
  }

  get schema () {
    return Schema.preSroc[this.slug]
  }

  static build (params) {
    return new this(params)
  }

  static translate (data) {
    throw new Error('You need to override "translate" in a subclass')
  }

  static async find (slug) {
    const result = await this.findRaw(slug)
    if (result) {
      return this.build(result)
    }
    return null
  }

  static async findById (id) {
    const stmt = this.rawQuery + ' WHERE id=$1::uuid'
    const result = await pool.query(stmt, [id])
    if (result.rowCount !== 1) {
      return null
    }
    return this.build(result.rows[0])
  }

  static async all () {
    const result = await pool.query(this.rawQuery)
    return {
      regimes: result.rows
    }
  }

  static async findRaw (slug) {
    const stmt = this.rawQuery + ' WHERE slug=$1::text'
    const result = await pool.query(stmt, [slug])
    if (result.rowCount !== 1) {
      return null
    }
    return result.rows[0]
  }

  static get rawQuery () {
    return 'SELECT * FROM regimes'
  }
}

module.exports = Regime
