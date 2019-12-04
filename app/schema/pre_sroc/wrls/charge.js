const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')

// Pre-SRoC Data Maps ===================

// const CHARGE_PARAMS_MAP = {
//   periodStart: 'charge_period_start',
//   periodEnd: 'charge_period_end',
//   credit: 'charge_credit',
//   billableDays: 'billableDays',
//   authorisedDays: 'abstractableDays',
//   volume: 'volume',
//   source: 'source',
//   season: 'season',
//   loss: 'loss',
//   section130Agreement: 'section130Agreement',
//   section126Agreement: 'section126Agreement',
//   section126Factor: 'abatementAdjustment',
//   section127Agreement: 'section127Agreement',
//   twoPartTariff: 'secondPartCharge',
//   compensationCharge: 'compensationCharge',
//   eiucSource: 'eiucSource',
//   waterUndertaker: 'waterUndertaker',
//   regionalChargingArea: 'region'
// }

// const CHARGE_RULES_MAP = {
//   charge_period_start: 'charge_period_start',
//   charge_period_end: 'charge_period_end',
//   charge_credit: 'charge_credit',
//   billableDays: 'billableDays',
//   abstractableDays: 'abstractableDays',
//   volume: 'volume',
//   source: 'source',
//   season: 'season',
//   loss: 'loss',
//   section130Agreement: 's130Agreement',
//   // section126Agreement: 's126Agreement',
//   abatementAdjustment: 'abatementAdjustment',
//   section127Agreement: 's127Agreement',
//   secondPartCharge: 'secondPartCharge',
//   compensationCharge: 'compensationCharge',
//   eiucSource: 'eiucSource',
//   waterUndertaker: 'waterUndertaker',
//   region: 'region'
// }

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
  regime_value_10: 'section126Agreement',
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
  regime_value_10: 's126Agreement',
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
      throw error
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
    const attrs = utils.translateData(transaction, DB_TO_PARAMS_MAP)
    console.log(attrs)
    return new Charge(utils.translateData(transaction, DB_TO_PARAMS_MAP))
  }

  static get schema () {
    return {
      periodStart: Joi.date().less(Joi.ref('periodEnd')).required(),
      periodEnd: Joi.date().greater(Joi.ref('periodStart')).max('31-MAR-2020').required(),
      credit: Joi.boolean().required(),
      billableDays: Joi.number().integer().min(0).max(366).required(),
      authorisedDays: Joi.number().integer().min(0).max(366).required(),
      volume: Joi.number().positive().required(),
      source: Joi.string().required(),
      season: Joi.string().required(),
      loss: Joi.string().required(),
      section130Agreement: Joi.boolean(),
      section126Agreement: Joi.boolean(),
      section126Factor: Joi.number().allow(null).empty(null).default(1.0),
      section127Agreement: Joi.boolean(),
      twoPartTariff: Joi.boolean().required(),
      compensationCharge: Joi.boolean().required(),
      eiucSource: Joi.string(),
      waterUndertaker: Joi.boolean().required(),
      regionalChargingArea: Joi.string().required()
    }
  }
}

module.exports = Charge
