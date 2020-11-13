const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const { stringValidator, regionValidator, customerReferenceValidator } = require('./validations')
const CustomerAttributeMap = require('./customer_attribute_map')
const { translateData } = require('../../../lib/utils')
const CustomerChange = require('../../../models/customer_change')

class WrlsCustomerChange extends CustomerChange {
  get customerReference () {
    return this.customer_reference
  }

  static instanceFromRequest (params) {
    const { error, value } = this.validate(params)
    if (error) {
      throw Boom.badData(error)
    }

    return this.build(this.translate(value))
  }

  static validate (data) {
    return Joi.validate(data, this.schema, { abortEarly: false })
  }

  static translate (data) {
    // translate filter values using main attribute map for pre-sroc WRLS naming
    return translateData(data, CustomerAttributeMap)
  }

  static get schema () {
    return {
      region: regionValidator.required(),
      customerReference: customerReferenceValidator.required(),
      customerName: stringValidator.max(360).required(),
      addressLine1: stringValidator.max(240).required(),
      addressLine2: stringValidator.max(240).allow('', null),
      addressLine3: stringValidator.max(240).allow('', null),
      addressLine4: stringValidator.max(240).allow('', null),
      addressLine5: stringValidator.max(60).allow('', null),
      addressLine6: stringValidator.max(60).allow('', null),
      postcode: stringValidator.max(60).allow('', null)
    }
  }
}

module.exports = WrlsCustomerChange
