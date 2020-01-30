const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')

class WrlsRemovalRequest {
  constructor (regimeId, params) {
    this.regimeId = regimeId
    this.filter = {}

    if (params) {
      Object.assign(this, params)
      this.filter = this.constructor.translate(params.filter)
    }
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

  static get schema () {
    return {
      region: Joi.string().uppercase().length(1).required(),
      filter: Joi.object({
        batchNumber: Joi.string().allow(null),
        customerReference: Joi.string().uppercase().allow(null),
        financialYear: Joi.number().integer().min(2000).max(2020).allow(null),
        licenceNumber: Joi.string().allow(null)
      }).optional().default({})
    }
  }
}

module.exports = WrlsRemovalRequest
