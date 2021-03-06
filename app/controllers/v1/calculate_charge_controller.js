const Boom = require('@hapi/boom')
const Authorisation = require('../../lib/authorisation')
const CalculateCharge = require('../../services/calculate_charge')
const Schema = require('../../schema/pre_sroc')

const basePath = '/v1/{regime_id}/calculate-charge'

class CalculateChargeController {
  // POST /v1/{regime_id}/calculate-charge
  static async calculate (req, h) {
    try {
      // check regime valid
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

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
      req.log(['ERROR'], err.stack)
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

  // POST /v1/{regime_id}/calculate_charge
  static async deprecatedCalculate (req, h) {
    try {
      // check regime valid
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

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
      req.log(['ERROR'], err.stack)
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

  static routes () {
    return [
      {
        method: 'POST',
        path: basePath,
        handler: this.calculate.bind(this)
      },
      {
        method: 'POST',
        path: '/v1/{regime_id}/calculate_charge',
        handler: this.deprecatedCalculate.bind(this)
      }
    ]
  }
}

module.exports = CalculateChargeController
