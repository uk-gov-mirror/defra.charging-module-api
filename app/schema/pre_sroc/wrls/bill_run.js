const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')

module.exports = class BillRun {
  constructor (data) {
    const { error, value } = this.validate(data)
    if (error) {
      throw error
    }

    if (value.filter) {
      value.filter = this.translate(value.filter)
    }

    Object.assign(this, value)
  }

  validate (data) {
    return Joi.validate(data, this.constructor.schema, { abortEarly: false })
  }

  translate (data) {
    // translate filter values using main attribute map for pre-sroc WRLS naming
    return utils.translateData(data, AttributeMap)
  }

  static get schema () {
    return {
      region: Joi.string().uppercase().length(1).required(),
      draft: Joi.boolean(),
      filter: Joi.object({
        batchNumber: Joi.string().allow(null),
        customerReference: Joi.string().uppercase().allow(null),
        financialYear: Joi.number().integer().min(2000).max(2020).allow(null)
      }).optional()
    }
  }
}

// let b = new BillRun({ region: 'A', draft: true, filter: { batchNumber: "555", customerReference: "AB2233112" } })
// b //?
// b.filter //?
