// Pre-SRoC Bill Run Nested Transactions =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const { logger } = require('../../lib/logger')
const SecurityCheckRegime = require('../../services/security_check_regime')
const SearchCollection = require('../../services/search_collection')
const { isValidUUID } = require('../../lib/utils')
const Schema = require('../../schema/pre_sroc')
const AddBillRunTransaction = require('../../services/add_bill_run_transaction')
const RemoveBillRunTransaction = require('../../services/remove_bill_run_transaction')
const RemoveMatchingBillRunTransactions = require('../../services/remove_matching_bill_run_transactions')

const basePath = '/v1/{regime_id}/billruns/{billrun_id}/transactions'

class BillRunTransactionsController {
  // GET /v1/{regime_id}/bill_runs/{billrun_id}/transactions?param1=xyz
  static async index (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await SecurityCheckRegime.call(req.params.regime_id)
      // check and verify if nested under billrun
      const billRun = await this.fetchBillRun(regime, req.params.billrun_id)

      // load the correct schema for the regime
      const searchRequest = new (Schema[regime.slug].BillRunTransactionsSearchRequest)(regime.id, billRun.id, req.query)

      // select all transactions matching search criteria for the regime (pre-sroc only)
      return SearchCollection.call(searchRequest)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  // GET /v1/{regime_id}/bill_runs/{billrun_id}/transactions/{id}
  static async show (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await SecurityCheckRegime.call(req.params.regime_id)
      // check and verify if nested under billrun
      const billRun = await this.fetchBillRun(regime, req.params.billrun_id)

      // encapsulate and validate request
      const result = await (Schema[regime.slug].Transaction).findBillRunRaw(regime.id, billRun.id, req.params.id)

      if (!result) {
        return Boom.notFound(`Transaction with id '${req.params.id} not found in bill run`)
      }

      return {
        transaction: result
      }
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  static async fetchBillRun (regime, billRunId) {
    if (!isValidUUID(billRunId)) {
      throw Boom.badRequest('Bill Run id is not a valid UUID')
    }

    // fetch BillRun
    const billRun = await (Schema[regime.slug].BillRun).find(regime.id, billRunId)
    if (!billRun) {
      throw Boom.notFound(`No Bill Run with id '${billRunId} found`)
    }

    return billRun
  }

  // Create a new transaction in the billrun
  // POST /v1/{regime_id}/billruns/{billrun_id}/transactions
  static async create (req, h) {
    try {
      const regime = await SecurityCheckRegime.call(req.params.regime_id)

      // check and verify if nested under billrun
      const billRunId = req.params.billrun_id
      const billRun = await this.fetchBillRun(regime, billRunId)

      // process and add transaction(s) in payload
      const payload = req.payload
      if (!payload) {
        // return HTTP 400
        return Boom.badRequest('No payload')
      }

      // load the correct schema for the regime
      const schema = Schema[regime.slug]

      // create Transaction object, validate and translate
      const transaction = schema.Transaction.instanceFromRequest(payload)

      // add transaction to the bill run (create db record)
      const tId = await AddBillRunTransaction.call(regime, billRun, transaction, schema)

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
        response.header('Location', this.regimeBillRunTransactionPath(regime, billRunId, tId))
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
      const regime = await SecurityCheckRegime.call(req.params.regime_id)
      // check and verify if nested under billrun
      const billRun = await this.fetchBillRun(regime, req.params.billrun_id)

      const tId = req.params.id
      if (!isValidUUID(tId)) {
        return Boom.badRequest('Transaction id is not a valid UUID')
      }

      const transaction = await (Schema[regime.slug].Transaction).find(regime.id, tId)
      if (!transaction) {
        return Boom.notFound(`Could not find a transaction with the id: '${tId}'`)
      }

      await RemoveBillRunTransaction.call(regime, billRun, transaction)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  // DELETE /v1/{regime_id}/bill_runs/{id}/transactions?param1=xyz
  static async removeMatching (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await SecurityCheckRegime.call(req.params.regime_id)

      // check and verify if nested under billrun
      const billRun = await this.fetchBillRun(regime, req.params.billrun_id)

      const removeRequest = new (Schema[regime.slug].BillRunTransactionsRemoveRequest)(regime, billRun, req.query)
      // mustn't be billed - deletes transaction matching criteria (or all if none)
      await RemoveMatchingBillRunTransactions.call(removeRequest)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      logger.error(err.stack)
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
