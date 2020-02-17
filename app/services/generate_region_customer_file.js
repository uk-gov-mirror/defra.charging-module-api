const scheme = require('../schema/pre_sroc')
const GenerateCustomerFile = require('../services/generate_customer_file')

async function call (regime, region) {
  const schema = scheme[regime.slug]
  const customerFile = await schema.CustomerFile.instanceFromRequest(regime.id, { region: region })

  return GenerateCustomerFile.call(customerFile)
}

module.exports = {
  call
}
