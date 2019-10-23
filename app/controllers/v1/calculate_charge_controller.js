const path = require('path')
const Boom = require('@hapi/boom')
const { logger } = require('../../lib/logger')
const Security = require('../../lib/security')
const ChargeCalculator = require('../../services/charge_calculator')

const basePath = '/v1/{regime_id}/calculate_charge'

async function calculate (req, h) {
  // check regime valid
  // select all transactions matching search criteria for the regime
  try {
    const regime = await Security.checkRegimeValid(req.params.regime_id)

    if (Boom.isBoom(regime)) {
      return regime
    }

    // process the charge params in the payload
    const payload = req.payload
    if (!payload) {
      // return HTTP 400
      return Boom.badRequest('No payload')
    }

    // load the correct validator for the regime
    const validator = require(path.resolve(__dirname, `../../schema/${regime.slug}_charge.js`))
    // validate the payload
    const validData = validator.validate(payload)

    if (validData.error) {
      // get the better formatted message(s)
      const msg = validData.error.details.map(e => e.message).join(', ')

      // return HTTP 422
      return Boom.badData(msg)
    }
    console.log(validData)
    // translate regime naming scheme into DB schema
    const chargeData = validator.regimeToRules(validData)

    console.log(chargeData)

    // submit charge calculation request
    const charge = await ChargeCalculator.calculateCharge(regime, chargeData)
    const amount = charge.chargeAmount * (chargeData.credit ? -1 : 1)
    const result = {
      charge: {
        amount: amount,
        calculation: charge
      }
    }

    // return HTTP 201 Created
    const response = h.response(result)
    // response.code(201)
    // response.header('Location', regimeTransactionPath(regime, tId))
    return response
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

const routes = [
  {
    method: 'POST',
    path: basePath,
    handler: calculate
  }
]

module.exports = {
  routes
}
