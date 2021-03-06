// Pre-SRoC Bill Run Nested Transactions =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const Authorisation = require('../../lib/authorisation')
const { isValidUUID } = require('../../lib/utils')
const AddBillRunTransaction = require('../../services/add_bill_run_transaction')
const RemoveBillRunTransaction = require('../../services/remove_bill_run_transaction')
const RemoveMatchingBillRunTransactions = require('../../services/remove_matching_bill_run_transactions')
const FindTransactionByClientId = require('../../services/find_transaction_by_client_id')

const basePath = '/v1/{regime_id}/billruns/{billrun_id}/transactions'

class BillRunTransactionsController {
  // GET /v1/{regime_id}/bill_runs/{billrun_id}/transactions?param1=xyz
  static async index (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      // check and verify if nested under billrun
      const billRun = await this.fetchBillRun(regime, req.params.billrun_id)

      // load the correct schema for the regime
      const searchRequest = new (regime.schema.BillRunTransactionsSearchRequest)(regime.id, billRun.id, req.query)

      // select all transactions matching search criteria for the regime (pre-sroc only)
      return regime.schema.Transaction.search(searchRequest)
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  // GET /v1/{regime_id}/bill_runs/{billrun_id}/transactions/{id}
  static async show (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      // check and verify if nested under billrun
      const billRun = await this.fetchBillRun(regime, req.params.billrun_id)

      // encapsulate and validate request
      const result = await (regime.schema.Transaction).findBillRunRaw(regime.id, billRun.id, req.params.id)

      if (!result) {
        return Boom.notFound(`Transaction with id '${req.params.id} not found in bill run`)
      }

      return {
        transaction: result
      }
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  static async fetchBillRun (regime, billRunId) {
    if (!isValidUUID(billRunId)) {
      throw Boom.badRequest('Bill Run id is not a valid UUID')
    }

    // fetch BillRun
    const billRun = await (regime.schema.BillRun).find(regime.id, billRunId)
    if (!billRun) {
      throw Boom.notFound(`No Bill Run with id '${billRunId} found`)
    }

    return billRun
  }

  // Create a new transaction in the billrun
  // POST /v1/{regime_id}/billruns/{billrun_id}/transactions
  static async create (req, h) {
    try {
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      // check and verify if nested under billrun
      const billRunId = req.params.billrun_id
      const billRun = await this.fetchBillRun(regime, billRunId)

      // process and add transaction(s) in payload
      const payload = req.payload
      if (!payload) {
        // return HTTP 400
        return Boom.badRequest('No payload')
      }

      // Call existingTransaction service if clientId is populated
      const { clientId } = payload
      const existingTransaction = clientId ? await FindTransactionByClientId.call(regime, clientId) : null

      // Return transaction details if it exsists
      if (existingTransaction) {
        return h.response({
          id: existingTransaction.id,
          clientId: existingTransaction.clientId
        })
          .code(409)
          .header('Location', this.regimeBillRunTransactionPath(regime, billRunId, existingTransaction.id))
      }

      // create Transaction object, validate and translate
      const transaction = regime.schema.Transaction.instanceFromRequest(payload)

      // add transaction to the bill run (create db record)
      const tId = await AddBillRunTransaction.call(regime, billRun, transaction, regime.schema)

      if (tId === 0) {
        // zero charge - special case return HTTP 200
        return h.response({ status: 'Zero value charge calculated' }).code(200)
      } else {
        // return HTTP 201 Created
        // '...clientId && { clientId }' means we only add clientId to the response object if it exists
        return h.response({
          transaction: {
            id: tId,
            ...clientId && { clientId }
          }
        })
          .code(201)
          .header('Location', this.regimeBillRunTransactionPath(regime, billRunId, tId))
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
      }
    }
  }

  //
  // DELETE /v1/{regime_id}/billruns/{billrun_id}/transactions/{id}
  static async remove (req, h) {
    // remove (delete) transaction
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      // check and verify if nested under billrun
      const billRun = await this.fetchBillRun(regime, req.params.billrun_id)

      const tId = req.params.id
      if (!isValidUUID(tId)) {
        return Boom.badRequest('Transaction id is not a valid UUID')
      }

      const transaction = await (regime.schema.Transaction).find(regime.id, tId)
      if (!transaction) {
        return Boom.notFound(`Could not find a transaction with the id: '${tId}'`)
      }

      await RemoveBillRunTransaction.call(regime, billRun, transaction)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  // DELETE /v1/{regime_id}/bill_runs/{id}/transactions?param1=xyz
  static async removeMatching (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

      // check and verify if nested under billrun
      const billRun = await this.fetchBillRun(regime, req.params.billrun_id)

      const removeRequest = new (regime.schema.BillRunTransactionsRemoveRequest)(regime, billRun, req.query)
      // mustn't be billed - deletes transaction matching criteria (or all if none)
      await RemoveMatchingBillRunTransactions.call(removeRequest)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  static regimeBillRunTransactionPath (regime, billRunId, transactionId) {
    return `${config.environment.serviceUrl}/v1/${regime.slug}/billruns/${billRunId}/transactions/${transactionId}`
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
        method: 'DELETE',
        path: `${basePath}`,
        handler: this.removeMatching.bind(this)
      },
      {
        method: 'DELETE',
        path: `${basePath}/{id}`,
        handler: this.remove.bind(this)
      },
      {
        method: 'POST',
        path: basePath,
        handler: this.create.bind(this)
      }
    ]
  }
}

module.exports = BillRunTransactionsController
