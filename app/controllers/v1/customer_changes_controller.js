// Customer changes Queue =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const { logger } = require('../../lib/logger')
const Authorisation = require('../../lib/authorisation')
const AddCustomerChange = require('../../services/add_customer_change')
const Schema = require('../../schema/pre_sroc')

const basePath = '/v1/{regime_id}/customer_changes'

class CustomerChangesController {
  // GET /v1/{regime_id}/customer_changes
  static async index (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      // load the correct schema for the regime
      const CustomerChange = Schema[regime.slug].CustomerChange

      const { page, perPage, sort, sortDir, ...q } = req.query

      // translate params into DB naming
      const params = q
      // force these criteria
      params.status = 'initialised'
      params.regime_id = regime.id

      // select all customer changes matching search criteria for the regime
      return CustomerChange.search(params, page, perPage, sort, sortDir)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  // GET /v1/{regime_id}/customer_changes/{id}
  static async show (req, h) {
    try {
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      const id = req.params.id

      // load the correct schema for the regime
      const schema = Schema[regime.slug]
      const customerChange = await schema.CustomerChange.findRaw(regime.id, id)

      if (customerChange === null) {
        return Boom.notFound(`No customer change found with id '${id}'`)
      }

      return {
        customerChange: customerChange
      }
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  // POST /v1/{regime_id}/customer_changes
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

  static regimeCustomerChangePath (regime, id) {
    return `${config.environment.serviceUrl}/v1/${regime.slug}/customer_changes/${id}`
  }

  static routes () {
    return [
      {
        method: 'GET',
        path: basePath,
        handler: this.index.bind(this)
      },
      {
        method: 'POST',
        path: basePath,
        handler: this.create.bind(this)
      },
      {
        method: 'GET',
        path: `${basePath}/{id}`,
        handler: this.show.bind(this)
      }
    ]
  }
}

module.exports = CustomerChangesController
