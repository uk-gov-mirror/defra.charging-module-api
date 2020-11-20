// Customer changes Queue =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const Authorisation = require('../../lib/authorisation')
const AddCustomerChange = require('../../services/add_customer_change')
const Schema = require('../../schema/pre_sroc')

const basePath = '/v1/{regime_id}/customer-changes'

class CustomerChangesController {
  // POST /v1/{regime_id}/customer-changes
  static async create (req, h) {
    try {
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      // process and add transaction(s) in payload
      const payload = req.payload
      if (!payload) {
        // return HTTP 400
        return Boom.badRequest('No payload')
      }
      // load the correct schema for the regime
      const schema = Schema[regime.slug]

      // create Transaction object, validate and translate
      const customerChange = schema.CustomerChange.instanceFromRequest(payload)

      // add transaction to the queue (create db record)
      const ccId = await AddCustomerChange.call(regime, customerChange)
      const result = {
        customerChange: {
          id: ccId
        }
      }
      // return HTTP 201 Created
      const response = h.response(result)
      response.code(201)
      response.header('Location', this.regimeCustomerChangePath(regime, ccId))
      return response
    } catch (err) {
      if (Boom.isBoom(err)) {
        // status 500 squashes error message for some reason
        if (err.output.statusCode === 500) {
          err.output.payload.message = err.message
        }
        return err
      } else {
        return Boom.boomify(err)
      }
    }
  }

  // POST /v1/{regime_id}/customer_changes
  static async deprecatedCreate (req, h) {
    try {
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      // process and add transaction(s) in payload
      const payload = req.payload
      if (!payload) {
        // return HTTP 400
        return Boom.badRequest('No payload')
      }
      // load the correct schema for the regime
      const schema = Schema[regime.slug]

      // create Transaction object, validate and translate
      const customerChange = schema.CustomerChange.instanceFromRequest(payload)

      // add transaction to the queue (create db record)
      const ccId = await AddCustomerChange.call(regime, customerChange)
      const result = {
        customerChange: {
          id: ccId
        }
      }
      // return HTTP 201 Created
      const response = h.response(result)
      response.code(201)
      response.header('Location', `${config.environment.serviceUrl}/v1/${regime.slug}/customer_changes/${ccId}`)
      return response
    } catch (err) {
      if (Boom.isBoom(err)) {
        // status 500 squashes error message for some reason
        if (err.output.statusCode === 500) {
          err.output.payload.message = err.message
        }
        return err
      } else {
        return Boom.boomify(err)
      }
    }
  }

  static regimeCustomerChangePath (regime, id) {
    return `${config.environment.serviceUrl}/v1/${regime.slug}/customer-changes/${id}`
  }

  static routes () {
    return [
      {
        method: 'POST',
        path: basePath,
        handler: this.create.bind(this)
      },
      {
        method: 'POST',
        path: '/v1/{regime_id}/customer_changes',
        handler: this.deprecatedCreate.bind(this)
      }
    ]
  }
}

module.exports = CustomerChangesController
