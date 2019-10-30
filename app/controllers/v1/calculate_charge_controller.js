// const path = require('path')
const Boom = require('@hapi/boom')
const { logger } = require('../../lib/logger')
const SecurityCheckRegime = require('../../services/security_check_regime')
const CalculateCharge = require('../../services/calculate_charge')
const Schema = require('../../schema')

const basePath = '/v1/{regime_id}/calculate_charge'

async function calculate (req, h) {
  // check regime valid
  // select all transactions matching search criteria for the regime
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    // process the charge params in the payload
    const payload = req.payload
    if (!payload) {
      // return HTTP 400
      return Boom.badRequest('No payload')
    }

    // load the correct charge validator for the regime
    const validator = Schema[regime.slug]

    // validate the payload
    const validData = validator.validateCharge(payload)

    if (validData.error) {
      console.log(validData.error.details)
      // get the better formatted message(s)
      const msg = validData.error.details.map(e => e.message).join(', ')

      // return HTTP 422
      return Boom.badData(msg)
    }

    // translate regime naming scheme into DB schema
    const chargeData = validator.translateCharge(validData)

    // submit charge calculation request
    const charge = await CalculateCharge.call(regime, chargeData)
    const amount = charge.calculation.chargeValue * (chargeData.credit ? -1 : 1)
    const result = {
      charge: {
        amount: amount,
        calculation: charge.calculation
      }
    }

    // return result with status HTTP 200 OK
    return result
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
