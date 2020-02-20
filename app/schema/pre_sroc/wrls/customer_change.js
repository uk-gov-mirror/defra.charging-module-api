const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const CustomerAttributeMap = require('./customer_attribute_map')
const { translateData } = require('../../../lib/utils')
const CustomerChange = require('../../../models/customer_change')

class WrlsCustomerChange extends CustomerChange {
  get customerReference () {
    return this.customer_reference
  }

  toJSON () {
    return {
      id: this.id,
      region: this.region,
      customerReference: this.customer_reference,
      customerName: this.customer_name,
      addressLine1: this.address_line_1,
      addressLine2: this.address_line_2,
      addressLine3: this.address_line_3,
      addressLine4: this.address_line_4,
      addressLine5: this.address_line_5,
      addressLine6: this.address_line_6,
      postcode: this.postcode
    }
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
      region: Joi.string().uppercase().length(1).required(),
      customerReference: Joi.string().uppercase().required(),
      customerName: Joi.string().required(),
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().allow('', null),
      addressLine3: Joi.string().allow('', null),
      addressLine4: Joi.string().allow('', null),
      addressLine5: Joi.string().allow('', null),
      addressLine6: Joi.string().allow('', null),
      postcode: Joi.string().allow('', null)
    }
  }

  static get rawQuery () {
    return `select id,
      region,
      customer_reference AS "customerReference",
      customer_name AS "customerName",
      address_line_1 AS "addressLine1",
      address_line_2 AS "addressLine2",
      address_line_3 AS "addressLine3",
      address_line_4 AS "addressLine4",
      address_line_5 AS "addressLine5",
      address_line_6 AS "addressLine6",
      postcode
      FROM customer_changes`
  }
}

module.exports = WrlsCustomerChange