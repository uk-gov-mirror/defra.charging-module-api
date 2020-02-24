// const path = require('path')
const Boom = require('@hapi/boom')
const { logger } = require('../../lib/logger')
const SecurityCheckRegime = require('../../services/security_check_regime')
const CalculateCharge = require('../../services/calculate_charge')
const Schema = require('../../schema/pre_sroc')

const basePath = '/v1/{regime_id}/calculate_charge'

async function calculate (req, h) {
  try {
    // check regime valid
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    // process the charge params in the payload
    const payload = req.payload
    if (!payload) {
      // return HTTP 400
      return Boom.badRequest('No payload')
    }

    // load the correct schema for the regime
    const schema = Schema[regime.slug]
    // create a Charge from the payload
    const charge = new schema.Charge(payload)

    // submit charge calculation request
    const calc = await CalculateCharge.call(regime, charge, schema)
    // return result with status HTTP 200 OK
    return calc.payload
  } catch (err) {
    logger.error(err.stack)
    if (Boom.isBoom(err)) {
      if (err.output.statusCode === 500) {
        err.output.payload.message = err.message
      }
      return err
    } else {
      return Boom.boomify(err, { statusCode: err.statusCode || 500 })
    }
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
