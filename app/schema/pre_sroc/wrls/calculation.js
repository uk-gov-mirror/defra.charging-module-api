const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')

// Pre-SRoC Data Maps ===================

const CHARGE_PARAMS_MAP = {
  periodStart: 'charge_period_start',
  periodEnd: 'charge_period_end',
  credit: 'charge_credit',
  billableDays: 'billableDays',
  authorisedDays: 'abstractableDays',
  volume: 'volume',
  source: 'source',
  season: 'season',
  loss: 'loss',
  section130Agreement: 'section130Agreement',
  section126Agreement: 'section126Agreement',
  section126Factor: 'abatementAdjustment',
  section127Agreement: 'section127Agreement',
  twoPartTariff: 'secondPartCharge',
  compensationCharge: 'compensationCharge',
  eiucSource: 'eiucSource',
  waterUndertaker: 'waterUndertaker',
  regionalChargingArea: 'region'
}

const CHARGE_RULES_MAP = {
  charge_period_start: 'charge_period_start',
  charge_period_end: 'charge_period_end',
  charge_credit: 'charge_credit',
  billableDays: 'billableDays',
  abstractableDays: 'abstractableDays',
  volume: 'volume',
  source: 'source',
  season: 'season',
  loss: 'loss',
  section130Agreement: 's130Agreement',
  // section126Agreement: 's126Agreement',
  abatementAdjustment: 'abatementAdjustment',
  section127Agreement: 's127Agreement',
  secondPartCharge: 'secondPartCharge',
  compensationCharge: 'compensationCharge',
  eiucSource: 'eiucSource',
  waterUndertaker: 'waterUndertaker',
  region: 'region'
}

const DB_TO_PARAMS_MAP = {
  charge_period_start: 'periodStart',
  charge_period_end: 'periodEnd',
  charge_credit: 'credit',
  billableDays: 'billableDays',
  abstractableDays: 'authorisedDays',
  volume: 'volume',
  source: 'source',
  season: 'season',
  loss: 'loss',
  section130Agreement: 'section130Agreement',
  section126Agreement: 'section126Agreement',
  abatementAdjustment: 'section126Factor',
  section127Agreement: 'section127Agreement',
  secondPartCharge: 'twoPartTariff',
  compensationCharge: 'compensationCharge',
  eiucSource: 'eiucSource',
  waterUndertaker: 'waterUndertaker',
  region: 'regionalChargingArea'
}

const DB_TO_CHARGE_RULES_MAP = {
  regime_value_4: 'billableDays',
  regime_value_5: 'abstractableDays',
  line_attr_5: 'volume',
  regime_value_6: 'source',
  regime_value_7: 'season',
  regime_value_8: 'loss',
  regime_value_9: 's130Agreement',
  // section126Agreement: 's126Agreement',
  regime_value_11: 'abatementAdjustment',
  regime_value_12: 's127Agreement',
  regime_value_16: 'secondPartCharge',
  regime_value_17: 'compensationCharge',
  regime_value_13: 'eiucSource',
  regime_value_14: 'waterUndertaker',
  region: 'region'
}

const CALC_TO_DB_MAP = {
  billableDays: 'billableDays',
  abstractableDays: 'abstractableDays',
  volume: 'volume',
  source: 'source',
  season: 'season',
  loss: 'loss',
  s130Agreement: 'section130Agreement',
  abatementAdjustment: 'abatementAdjustment',
  s127Agreement: 'section127Agreement',
  secondPartCharge: 'secondPartCharge',
  compensationCharge: 'compensationCharge',
  eiucSource: 'eiucSource',
  waterUndertaker: 'waterUndertaker',
  region: 'region'
}

const CALC_TO_DB_MAP2 = {
  sucFactor: 'line_attr_4',
  sourceFactor: 'line_attr_6',
  seasonFactor: 'line_attr_7',
  lossFactor: 'line_attr_8',
  abatementAdjustment: '',
  s127Agreement: '',
  s130Agreement: '',
  eiucSourceFactor: '',
  eiucFactor: ''
}

class Calculation {
  constructor (data, isCredit) {
    const { error, value } = this.constructor.validate(data)
    if (error) {
      throw error
    }
    this.uuid = value.__DecisionID__
    this.generatedAt = new Date()
    this.calculation = value.WRLSChargingResponse

    const amt = Math.round(value.WRLSChargingResponse.chargeValue * 100.0)
    this.chargeValue = (isCredit ? -amt : amt)
  }

  static validate (data) {
    // not sure this is really necessary ....
    const result = Joi.validate(data, this.schema, { abortEarly: false })
    if (result.error) {
      return result
    }

    // check if there are any (error) messages returned
    // and add as error to the result
    const messages = data.WRLSChargingResponse.messages

    if (Array.isArray(messages) && messages.length) {
      result.error = {
        details: messages.map(m => { return { message: m } })
      }
    }
    return result
  }

  static translate (data) {
    return {
      line_attr_4: data.sucFactor,
      line_attr_6: data.sourceFactor,
      line_attr_7: data.seasonFactor,
      line_attr_8: data.lossFactor,
      line_attr_9: data.s130Agreement,
      line_attr_10: (data.abatementAdjustment ? data.abatementAdjustment : data.s127Agreement),
      regime_value_13: data.eiucSourceFactor,
      line_attr_14: data.eiucFactor
    }
  }

  // charge request payload
  get payload () {
    const calc = this.calculation
    return {
      calculation: {
        chargeValue: this.chargeValue,
        sourceFactor: calc.sourceFactor,
        seasonFactor: calc.seasonFactor,
        lossFactor: calc.lossFactor,
        licenceHolderChargeAgreement: calc.s130Agreement,
        chargeElementAgreement: this.chargeElementAgreement,
        eiucSourceFactor: calc.eiucSourceFactor,
        eiuc: calc.eiucFactor,
        suc: calc.sucFactor
      }
    }
  }

  get chargeElementAgreement () {
    if (this.calculation.abatementAdjustment) {
      return this.calculation.abatementAdjustment
    } else {
      return this.calculation.s127Agreement
    }
  }

  /**
   * Translate charge calculation data scheme into WRLS naming
   * @param  {object} data   An object containing charge calculation params
   * @return {object}    Object containing charge calculation with translated names
   */
  static translateCalculation (data, output = {}) {
    output.sourceFactor = data.sourceFactor
    output.seasonFactor = data.seasonFactor
    output.lossFactor = data.lossFactor
    output.licenceHolderChargeAgreement = data.s130Agreement
    output.chargeElementAgreement = (data.abatementAdjustment ? data.abatementAdjustment
      : data.s127Agreement)
    output.eiucSourceFactor = data.eiucSourceFactor
    output.eiuc = data.eiucFactor
    output.suc = data.sucFactor

    return output
  }

  static get schema () {
    return {
      __DecisionID__: Joi.string(),
      WRLSChargingResponse: Joi.object({
        chargeValue: Joi.number(),
        decisionPoints: Joi.object({
          sourceFactor: Joi.number(),
          seasonFactor: Joi.number(),
          lossFactor: Joi.number(),
          volumeFactor: Joi.number(),
          abatementAdjustment: Joi.number(),
          s127Agreement: Joi.number(),
          s130Agreement: Joi.number(),
          secondPartCharge: Joi.boolean(),
          waterUndertaker: Joi.boolean(),
          eiucFactor: Joi.number(),
          compensationCharge: Joi.boolean(),
          eiucSourceFactor: Joi.number(),
          sucFactor: Joi.number()
        }),
        messages: Joi.array(),
        sucFactor: Joi.number(),
        volumeFactor: Joi.number(),
        sourceFactor: Joi.number(),
        seasonFactor: Joi.number(),
        lossFactor: Joi.number(),
        abatementAdjustment: Joi.string().allow(null),
        s127Agreement: Joi.string().allow(null),
        s130Agreement: Joi.string().allow(null),
        eiucSourceFactor: Joi.number(),
        eiucFactor: Joi.number()
      })
    }
  }
}

module.exports = Calculation
