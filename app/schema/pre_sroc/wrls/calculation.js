const Joi = require('@hapi/joi')

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
