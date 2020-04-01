const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')
const { regionValidator } = require('./validations')

class WrlsBillRunCreateRequest {
  constructor (regimeId, params) {
    this.regimeId = regimeId

    const { error, value } = this.constructor.validate(params)
    if (error) {
      throw error
    }

    Object.assign(this, this.constructor.translate(value))
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
      region: regionValidator.required()
    }
  }
}

module.exports = WrlsBillRunCreateRequest
