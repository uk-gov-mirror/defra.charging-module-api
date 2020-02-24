const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const { stringValidator } = require('./validations')
const utils = require('../../../lib/utils')

const DB_TO_PARAMS_MAP = {
  charge_period_start: 'periodStart',
  charge_period_end: 'periodEnd',
  charge_credit: 'credit',
  regime_value_4: 'billableDays',
  regime_value_5: 'authorisedDays',
  line_attr_5: 'volume',
  regime_value_6: 'source',
  regime_value_7: 'season',
  regime_value_8: 'loss',
  regime_value_9: 'section130Agreement',
  regime_value_11: 'section126Factor',
  regime_value_12: 'section127Agreement',
  regime_value_13: 'eiucSource',
  regime_value_14: 'waterUndertaker',
  regime_value_15: 'regionalChargingArea',
  regime_value_16: 'twoPartTariff',
  regime_value_17: 'compensationCharge'
}

const DB_TO_CHARGE_RULES_MAP = {
  regime_value_4: 'billableDays',
  regime_value_5: 'abstractableDays',
  line_attr_5: 'volume',
  regime_value_6: 'source',
  regime_value_7: 'season',
  regime_value_8: 'loss',
  regime_value_9: 's130Agreement',
  regime_value_11: 'abatementAdjustment',
  regime_value_12: 's127Agreement',
  regime_value_16: 'secondPartCharge',
  regime_value_17: 'compensationCharge',
  regime_value_13: 'eiucSource',
  regime_value_14: 'waterUndertaker',
  regime_value_15: 'region'
}

class Charge {
  constructor (data) {
    const { error, value } = this.constructor.validate(data)
    if (error) {
      throw Boom.badData(error)
    }

    Object.assign(this, this.constructor.translate(value))
  }

  get payload () {
    return {
      WRLSChargingRequest: utils.translateData(this, DB_TO_CHARGE_RULES_MAP)
    }
  }

  static validate (data) {
    const result = Joi.validate(data, this.schema, { abortEarly: false })
    if (result.error) {
      return result
    }

    return utils.validateFinancialYear(result.value)
  }

  static translate (data) {
    return utils.translateData(data, AttributeMap)
  }

  static fromTransaction (transaction) {
    // transaction in DB naming
    return new Charge(utils.translateData(transaction, DB_TO_PARAMS_MAP))
  }

  static get schema () {
    return {
      periodStart: Joi.date().less(Joi.ref('periodEnd')).min('01-APR-2014').required(),
      periodEnd: Joi.date().greater(Joi.ref('periodStart')).max('31-MAR-2021').required(),
      credit: Joi.boolean().required(),
      billableDays: Joi.number().integer().min(0).max(366).required(),
      authorisedDays: Joi.number().integer().min(0).max(366).required(),
      volume: Joi.number().greater(0).required(),
      source: stringValidator.required(), // validated in rules service
      season: stringValidator.required(), // validated in rules service
      loss: stringValidator.required(), // validated in rules service
      section130Agreement: Joi.boolean().required(),
      section126Factor: Joi.number().allow(null).empty(null).default(1.0),
      section127Agreement: Joi.boolean().required(),
      twoPartTariff: Joi.boolean().required(),
      compensationCharge: Joi.boolean().required(),
      eiucSource: stringValidator.when('compensationCharge', { is: Joi.valid(true), then: Joi.required() }), // validated in the rules service
      waterUndertaker: Joi.boolean().required(),
      regionalChargingArea: stringValidator.required() // validated in the rules service
    }
  }
}

module.exports = Charge
