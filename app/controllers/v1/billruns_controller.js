// Pre-SRoC Bill Runs =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const Authorisation = require('../../lib/authorisation')
const CreateBillRun = require('../../services/create_bill_run')
const ViewBillRun = require('../../services/view_bill_run')
const ApproveBillRun = require('../../services/approve_bill_run')
const UnapproveBillRun = require('../../services/unapprove_bill_run')
const RemoveBillRun = require('../../services/remove_bill_run')
const SendBillRun = require('../../services/send_bill_run')
const GenerateRegionCustomerFile = require('../../services/generate_region_customer_file')
const { isValidUUID } = require('../../lib/utils')

const basePath = '/v1/{regime_id}/billruns'

class BillRunsController {
  // GET /v1/{regime_id}/bill_runs?param1=xyz
  static async index (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)
      // load the correct schema for the regime
      const searchRequest = new (regime.schema.BillRunSearchRequest)(regime, req.query)

      // select all transactions matching search criteria for the regime (pre-sroc only)
      return regime.schema.BillRun.search(searchRequest)
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  // GET /v1/{regime_id}/bill_runs/{id}?param1=xyz
  static async show (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      const id = req.params.id
      if (!isValidUUID(id)) {
        return Boom.badRequest('Bill Run id is not a valid UUID')
      }

      // encapsulate and validate request
      const request = new (regime.schema.BillRunViewRequest)(regime, id, req.query)

      return {
        billRun: await ViewBillRun.call(request)
      }
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  // POST /v1/{regime_id}/bill_runs/{id}
  static async send (req, h) {
    try {
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      const id = req.params.id
      if (!isValidUUID(id)) {
        return Boom.badRequest('Bill Run id is not a valid UUID')
      }
      // fetch BillRun
      const billRun = await (regime.schema.BillRun).find(regime.id, id)
      if (!billRun) {
        return Boom.notFound(`No Bill Run with id '${id} found`)
      }

      const sentBillRun = await SendBillRun.call(regime, billRun)

      // check if any customer changes are waiting to be exported for this region
      const customerFile = await GenerateRegionCustomerFile.call(regime, billRun.region)
      if (customerFile.changesCount > 0) {
        // we have a file
        sentBillRun.addCustomerFile(customerFile)
      }

      // return HTTP 200
      return {
        billRun: sentBillRun
      }
    } catch (err) {
      req.log(['ERROR'], err.stack)
      if (Boom.isBoom(err)) {
        // status 500 squashes error message for some reason
        if (err.output.statusCode === 500) {
          err.output.payload.message = err.message
        }
        return err
      } else if (err.isJoi) {
        return Boom.badData(err.details.map(e => e.message).join(', '))
      } else {
        return Boom.boomify(err)
      }
    }
  }

  // This now only creates a billrun record and does not generate the summary
  // The operations will now be to create a billrun - add records to it
  // POST /v1/{regime_id}/bill_runs
  static async create (req, h) {
    try {
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      const payload = req.payload
      if (!payload) {
        // return HTTP 400
        return Boom.badRequest('No payload')
      }

      const request = new (regime.schema.BillRunCreateRequest)(regime.id, req.payload)

      const result = await CreateBillRun.call(request)

      // return HTTP 201 Created
      const response = h.response({
        billRun: result
      })
      response.code(201)
      response.header('Location', this.regimeBillRunPath(regime, result.id))
      return response
    } catch (err) {
      req.log(['ERROR'], err.stack)
      if (Boom.isBoom(err)) {
        // status 500 squashes error message for some reason
        if (err.output.statusCode === 500) {
          err.output.payload.message = err.message
        }
        return err
      } else if (err.isJoi) {
        return Boom.badData(err.details.map(e => e.message).join(', '))
      } else {
        return Boom.boomify(err)
      }
    }
  }

  // PATCH /v1/{regime_id}/bill_runs/{id}/approve
  static async approve (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      const id = req.params.id
      if (!isValidUUID(id)) {
        return Boom.badRequest('Bill Run id is not a valid UUID')
      }

      // mustn't be billed - updates billrun and all assoc. transactions
      await ApproveBillRun.call(regime, id)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  // PATCH /v1/{regime_id}/bill_runs/{id}/unapprove
  static async unapprove (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      const id = req.params.id
      if (!isValidUUID(id)) {
        return Boom.badRequest('Bill Run id is not a valid UUID')
      }

      // mustn't be billed - updates billrun and all assoc. transactions
      await UnapproveBillRun.call(regime, id)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  // DELETE /v1/{regime_id}/bill_runs/{id}
  static async remove (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      const id = req.params.id
      if (!isValidUUID(id)) {
        return Boom.badRequest('Bill Run id is not a valid UUID')
      }

      // mustn't be billed - deletes billrun and all assoc. transactions
      await RemoveBillRun.call(regime, id)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  static regimeBillRunPath (regime, id) {
    return `${config.environment.serviceUrl}/v1/${regime.slug}/billruns/${id}`
  }

  static routes () {
    return [
      {
        method: 'GET',
        path: basePath,
        handler: this.index.bind(this)
      },
      {
        method: 'GET',
        path: `${basePath}/{id}`,
        handler: this.show.bind(this)
      },
      {
        method: 'POST',
        path: basePath,
        handler: this.create.bind(this)
      },
      {
        method: 'PATCH',
        path: `${basePath}/{id}/approve`,
        handler: this.approve.bind(this)
      },
      {
        method: 'PATCH',
        path: `${basePath}/{id}/unapprove`,
        handler: this.unapprove.bind(this)
      },
      {
        method: 'POST',
        path: `${basePath}/{id}/send`,
        handler: this.send.bind(this)
      },
      {
        method: 'DELETE',
        path: `${basePath}/{id}`,
        handler: this.remove.bind(this)
      }
    ]
  }
}

module.exports = BillRunsController
