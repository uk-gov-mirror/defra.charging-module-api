const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')
const Validations = require('./validations')

class WrlsBillRunTransactionsSearchRequest {
  constructor (regimeId, billRunId, params) {
    this.regimeId = regimeId
    this.billRunId = billRunId

    if (params) {
      const { error, value } = this.constructor.validate(params)
      if (error) {
        throw Boom.badData(error)
      }

      Object.assign(this, value)
    }
  }

  get collectionName () {
    return 'transactions'
  }

  get searchParams () {
    const params = {}
    this.constructor.inputCols.forEach(k => {
      const mappedName = AttributeMap[k]
      if (k && this[k]) {
        params[mappedName] = this[k]
      }
    })
    params.regime_id = this.regimeId
    params.bill_run_id = this.billRunId
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
        const table = (col === 'transaction_filename' ? 'b' : 't')

        if (val && val.indexOf && val.indexOf('%') !== -1) {
          where.push(`${table}.${col} like $${attrCount++}`)
        } else {
          where.push(`${table}.${col}=$${attrCount++}`)
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
    const q = `SELECT COUNT(*) FROM transactions t JOIN bill_runs b ON t.bill_run_id = b.id WHERE ${where.join(' AND ')}`

    const result = await db.query(q, values)
    return parseInt(result.rows[0].count)
  }

  orderQuery () {
    // default sort order for WRLS is customer_reference, licence_number (line_attr_1), transaction_reference asc
    // const order = []
    const defaultCols = ['customer_reference', 'line_attr_1', 'transaction_reference']
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
      if (c === 'transaction_filename') {
        return `b.${c} ${this.sortDir}`
      } else {
        return `t.${c} ${this.sortDir}`
      }
    })

    // add additional sub-sort on customer reference
    if (!sortCols.includes('customer_reference')) {
      order.push(`t.customer_reference ${this.sortDir}`)
    }
    order.push(`t.created_at ${this.sortDir}`)

    return order
  }

  static validate (data) {
    return Joi.validate(data, this.schema, { abortEarly: false })
  }

  static translate (data) {
    // translate filter values using main attribute map for pre-sroc WRLS naming
    return utils.translateData(data, AttributeMap)
  }

  static async instanceFromRequest (regimeId, params) {
    const { error, value } = this.validate(params)
    if (error) {
      throw Boom.badData(error)
    }

    return new this(regimeId, value)
  }

  static get inputCols () {
    return [
      'region',
      'batchNumber',
      'customerReference',
      'licenceNumber',
      'chargeElementId',
      'financialYear',
      'billRunNumber',
      'transactionFileReference',
      'transactionReference'
    ]
  }

  static get schema () {
    return {
      region: Validations.regionValidator,
      batchNumber: Validations.stringValidator,
      customerReference: Validations.customerReferenceValidator,
      licenceNumber: Validations.stringValidator,
      chargeElementId: Validations.stringValidator,
      financialYear: Validations.financialYearValidator,
      billRunNumber: Joi.number().integer().min(10000).max(99999),
      transactionFileReference: Validations.fileReferenceValidator,
      transactionReference: Validations.transactionReferenceValidator,
      page: Validations.pageValidator,
      perPage: Validations.perPageValidator,
      sort: Joi.string(),
      sortDir: Joi.string().lowercase().valid('asc', 'desc').default('asc')
    }
  }
}

module.exports = WrlsBillRunTransactionsSearchRequest
