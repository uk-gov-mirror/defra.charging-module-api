const Boom = require('@hapi/boom')
const RuleService = require('../lib/connectors/rules')
const utils = require('../lib/utils')

async function call (regime, schema, params) {
  try {
    // structure params for regime
    // extract dates
    const startDate = params.charge_period_start
    // const endDate = params.charge_period_end
    const credit = params.charge_credit

    const fy = utils.financialYearFromDate(startDate)

    const pp = Object.entries(params).reduce((result, [k, v]) => {
      if (k !== 'charge_period_start' && k !== 'charge_period_end' && k !== 'charge_credit') {
        result[k] = v
      }
      return result
    }, {})

    // TODO: remove these once rules are updated
    pp.section130Agreement = 'NULL'
    pp.section127Agreement = 'NULL'

    const chargePayload = schema.buildChargeRulesPayload(pp)

    const result = await RuleService.calculateCharge(regime, fy, chargePayload)

    return schema.extractCalculation(result, credit)
  } catch (err) {
    if (err.name === 'StatusCodeError') {
      console.log(err)
      throw Boom.internal('Rule Service Error: ' + err.error.message)
    } else if (err.name === 'RequestError') {
      throw Boom.internal(`Error communicating with the Rule Service (${err.message})`)
    } else {
      throw err
    }
  }
}

module.exports = {
  call
}
