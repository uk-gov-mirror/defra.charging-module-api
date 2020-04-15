const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')
const Validations = require('./validations')
const BillRun = require('./bill_run')

class WrlsBillRunViewRequest {
  constructor (regime, billRunId, params) {
    this.regime = regime
    this.billRunId = billRunId
    this.searchParams = {}

    if (params) {
      const { error, value } = this.constructor.validate(params)
      if (error) {
        throw Boom.badData(error)
      }

      this.searchParams = value
    }
  }

  get regimeId () {
    return this.regime.id
  }

  get model () {
    return BillRun
  }

  static validate (data) {
    return Joi.validate(data, this.schema, { abortEarly: false })
  }

  static translate (data) {
    // translate filter values using main attribute map for pre-sroc WRLS naming
    return utils.translateData(data, AttributeMap)
  }

  static get schema () {
    return {
      customerReference: Validations.customerReferenceValidator,
      licenceNumber: Validations.stringValidator
    }
  }
}

module.exports = WrlsBillRunViewRequest
