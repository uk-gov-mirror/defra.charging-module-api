const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')
const Validations = require('./validations')
const BillRun = require('./bill_run')

class WrlsBillRunSearchRequest {
  constructor (regime, params) {
    this.regime = regime

    if (params) {
      const { error, value } = this.constructor.validate(params)
      if (error) {
        throw Boom.badData(error)
      }

      Object.assign(this, value)
    }
  }

  get regimeId () {
    return this.regime.id
  }

  get collectionName () {
    return 'billRuns'
  }

  get searchParams () {
    const params = {}
    this.constructor.inputCols.forEach(k => {
      const mappedName = AttributeMap[k]
      if (k && this[k]) {
        params[mappedName] = this[k]
      }
    })
    params.regime_id = this.regime.id
    params.pre_sroc = true
    return params
  }

  get whereClause () {
    const where = []
    const values = []
    const params = this.searchParams
    let attrCount = 1

    Object.keys(params).forEach(col => {
      if (col) {
        const val = params[col]

        if (val && val.indexOf && val.indexOf('%') !== -1) {
          where.push(`${col} like $${attrCount++}`)
        } else {
          where.push(`${col}=$${attrCount++}`)
        }
        values.push(val)
      }
    })

    return {
      where,
      values
    }
  }

  get offset () {
    return (this.page - 1) * this.perPage
  }

  get limit () {
    return this.perPage
  }

  async totalCount (db) {
    const { where, values } = this.whereClause
    const q = `SELECT COUNT(*) FROM bill_runs WHERE ${where.join(' AND ')}`

    const result = await db.query(q, values)
    return parseInt(result.rows[0].count)
  }

  async query (db) {
    const sort = this.sort || ['region', 'bill_run_number']

    return BillRun.search(this.searchParams, this.page, this.perPage, sort, this.sortDir, db)
  }

  orderQuery () {
    const defaultCols = ['region', 'bill_run_number']
    let sortCols = []

    if (this.sort) {
      let cols
      if (this.sort instanceof Array) {
        cols = this.sort
      } else {
        cols = this.sort.split(',')
      }

      for (let i = 0; i < cols.length; i++) {
        const col = AttributeMap[cols[i]]
        if (col) {
          sortCols.push(col)
        }
      }
    }

    if (sortCols.length === 0) {
      sortCols = defaultCols
    }

    const order = sortCols.map(c => {
      return `${c} ${this.sortDir}`
    })

    order.push(`created_at ${this.sortDir}`)

    return order
  }

  static validate (data) {
    return Joi.validate(data, this.schema, { abortEarly: false })
  }

  static translate (data) {
    // translate filter values using main attribute map for pre-sroc WRLS naming
    return utils.translateData(data, AttributeMap)
  }

  static async instanceFromRequest (regime, params) {
    const { error, value } = this.validate(params)
    if (error) {
      throw Boom.badData(error)
    }

    return new this(regime, value)
  }

  static get inputCols () {
    return [
      'region',
      'status',
      'billRunNumber',
      'transactionFileReference'
    ]
  }

  static get schema () {
    return {
      region: Validations.regionValidator,
      status: Validations.stringValidator,
      billRunNumber: Joi.number().integer().min(10000).max(99999),
      transactionFileReference: Validations.fileReferenceValidator,
      page: Validations.pageValidator,
      perPage: Validations.perPageValidator,
      sort: Joi.string(),
      sortDir: Joi.string().lowercase().valid('asc', 'desc').default('asc')
    }
  }
}

module.exports = WrlsBillRunSearchRequest
