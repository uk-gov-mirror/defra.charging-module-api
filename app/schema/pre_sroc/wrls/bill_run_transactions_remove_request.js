const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')
const Validations = require('./validations')

class WrlsBillRunTransactionsRemoveRequest {
  constructor (regime, billRun, params) {
    this.regime = regime
    this.billRun = billRun

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
    params.regime_id = this.regime.id
    params.bill_run_id = this.billRun.id
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

  static validate (data) {
    return Joi.validate(data, this.schema, { abortEarly: false })
  }

  static translate (data) {
    // translate filter values using main attribute map for pre-sroc WRLS naming
    return utils.translateData(data, AttributeMap)
  }

  static get inputCols () {
    return [
      'customerReference',
      'licenceNumber',
      'financialYear'
    ]
  }

  static get schema () {
    return {
      customerReference: Validations.customerReferenceValidator,
      licenceNumber: Validations.stringValidator,
      financialYear: Validations.financialYearValidator
    }
  }
}

module.exports = WrlsBillRunTransactionsRemoveRequest
