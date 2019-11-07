const RuleService = require('../lib/connectors/rules')

async function call (regime, params) {
  // structure params for regime
  const result = await RuleService.calculateCharge(regime, params)
  return buildResponse(result)
}

function buildResponse (data) {
  return {
    uuid: data.__DecisionID__,
    generatedAt: new Date(),
    calculation: data.tcmChargingResponse
  }
}

module.exports = {
  call
}
