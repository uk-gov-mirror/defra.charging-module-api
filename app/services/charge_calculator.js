const RuleService = require('../lib/connectors/rules')

async function calculateCharge (regime, params) {
  // structure params for regime
  const result = await RuleService.calculateCharge(regime, params)

  return result
}

module.exports = {
  calculateCharge
}
