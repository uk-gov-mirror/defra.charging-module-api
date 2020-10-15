const Boom = require('@hapi/boom')
const { logger } = require('../../lib/logger')
const config = require('../../../config/config')
const Authorisation = require('../../lib/authorisation')
const AddTransaction = require('../../services/add_transaction')
const RemoveTransaction = require('../../services/remove_transaction')
const { isValidUUID } = require('../../lib/utils')

const basePath = '/v1/{regime_id}/transactions'

class TransactionsController {
  // GET /v1/{regime_id}/transactions
  static async index (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      // load the correct schema for the regime
      const searchRequest = new (regime.schema.TransactionSearchRequest)(regime.id, req.query)

      return regime.schema.Transaction.search(searchRequest)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  // GET /v1/{regime_id}/transactions/{id}
  static async show (req, h) {
    try {
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      const id = req.params.id

      if (!isValidUUID(id)) {
        return Boom.badRequest('Transaction id is not a valid UUID')
      }

      const transaction = await regime.schema.Transaction.findRaw(regime.id, req.params.id)

      if (transaction === null) {
        return Boom.notFound(`No transaction found with id '${id}'`)
      }

      return {
        transaction: transaction
      }
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  // POST /v1/{regime_id}/transactions
  // POST /v1/{regime_id}/billruns/{billrun_id}/transactions
  static async create (req, h) {
    try {
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      // check and verify if nested under billrun
      const billRunId = req.params.bill_run_id
      if (billRunId && !isValidUUID(billRunId)) {
        return Boom.badRequest('BillRun id is not a valid UUID')
      }

      // process and add transaction(s) in payload
      const payload = req.payload
      if (!payload) {
        // return HTTP 400
        return Boom.badRequest('No payload')
      }
      // load the correct schema for the regime
      // const schema = Schema[regime.slug]

      // create Transaction object, validate and translate
      const transaction = regime.schema.Transaction.instanceFromRequest(payload)

      // add transaction to the queue (create db record)
      const tId = await AddTransaction.call(regime, transaction, regime.schema)
      if (tId === 0) {
        // zero charge - special case return HTTP 200
        return h.response({ status: 'Zero value charge calculated' }).code(200)
      } else {
        // return HTTP 201 Created
        const response = h.response({
          transaction: {
            id: tId
          }
        })
        response.code(201)
        response.header('Location', this.regimeTransactionPath(regime, tId))
        return response
      }
    } catch (err) {
      if (Boom.isBoom(err)) {
        // status 500 squashes error message for some reason
        if (err.output.statusCode === 500) {
          err.output.payload.message = err.message
        }
        return err
      } else {
        return Boom.boomify(err, { statusCode: err.statusCode || 500 })
        // return Boom.boomify(err)
      }
    }
  }

  //
  // DELETE /v1/{regime_id}/transactions/{id}
  //
  static async remove (req, h) {
    // remove (delete) transaction
    try {
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      await RemoveTransaction.call(regime, req.params.id)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  static regimeTransactionPath (regime, transactionId) {
    return `${config.environment.serviceUrl}/v1/${regime.slug}/transactions/${transactionId}`
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
        path: basePath + '/{id}',
        handler: this.show.bind(this)
      },
      {
        method: 'DELETE',
        path: basePath + '/{id}',
        handler: this.remove.bind(this)
      }
    ]
  }
}

module.exports = TransactionsController
