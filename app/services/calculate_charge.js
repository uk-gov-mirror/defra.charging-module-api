const Boom = require('@hapi/boom')
const RuleService = require('../lib/connectors/rules')
const utils = require('../lib/utils')

async function call (regime, charge, schema) {
  try {
    const fy = utils.financialYearFromDate(charge.charge_period_start)
    const isCredit = charge.charge_credit

    const payload = charge.payload
    const resp = await RuleService.calculateCharge(regime, fy, payload)

    return new schema.Calculation(resp, isCredit)
  } catch (err) {
    switch (err.name) {
      case 'StatusCodeError':
        throw Boom.internal('Rule Service Error: ' + err.error.message)
      case 'RequestError':
        throw Boom.internal(`Error communicating with the Rule Service (${err.message})`)
      default:
        throw err
    }
  }
}

module.exports = {
  call
}
