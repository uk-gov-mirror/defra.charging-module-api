const Boom = require('@hapi/boom')
// const Transaction = require('../../models/transaction')
const { logger } = require('../../lib/logger')
const config = require('../../../config/config')
const SecurityCheckRegime = require('../../services/security_check_regime')
const ApproveTransaction = require('../../services/approve_transaction')
const UnapproveTransaction = require('../../services/unapprove_transaction')
const AddTransaction = require('../../services/add_transaction')
const RemoveTransaction = require('../../services/remove_transaction')
const FindTransaction = require('../../services/find_transaction')
const SearchCollection = require('../../services/search_collection')
const { isValidUUID } = require('../../lib/utils')
const Schema = require('../../schema/pre_sroc')

const basePath = '/v1/{regime_id}/transactions'

class TransactionsController {
  // GET /v1/{regime_id}/transactions
  static async index (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      const regime = await SecurityCheckRegime.call(req.params.regime_id)

      // load the correct schema for the regime
      const searchRequest = new (Schema[regime.slug].TransactionSearchRequest)(regime.id, req.query)

      // select all transactions matching search criteria for the regime (pre-sroc only)
      return SearchCollection.call(searchRequest)

      // // load the correct schema for the regime
      // const Transaction = Schema[regime.slug].Transaction

      // const { page, perPage, sort, sortDir, ...q } = req.query

      // // translate params into DB naming
      // const params = Transaction.translate(q)
      // // force these criteria
      // params.regime_id = regime.id
      // params.pre_sroc = 'true'

      // // select all transactions matching search criteria for the regime (pre-sroc only)
      // return Transaction.search(params, page, perPage, sort, sortDir)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  // GET /v1/{regime_id}/transactions/{id}
  static async show (req, h) {
    try {
      const regime = await SecurityCheckRegime.call(req.params.regime_id)

      const id = req.params.id

      const transaction = await FindTransaction.call(regime, id)

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
      const regime = await SecurityCheckRegime.call(req.params.regime_id)

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
      const schema = Schema[regime.slug]

      // create Transaction object, validate and translate
      const transaction = schema.Transaction.instanceFromRequest(payload)

      // add transaction to the queue (create db record)
      const tId = await AddTransaction.call(regime, transaction, schema)
      console.log(tId)
      console.log(this)
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
      const regime = await SecurityCheckRegime.call(req.params.regime_id)
      await RemoveTransaction.call(regime, req.params.id)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  //
  // PATCH /v1/{regime_id}/transactions/{id}/approve
  //
  static async approve (req, h) {
    // approve transaction for billing
    try {
      const regime = await SecurityCheckRegime.call(req.params.regime_id)

      await ApproveTransaction.call(regime, req.params.id)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  //
  // PATCH /v1/{regime_id}/transactions/{id}/unapprove
  //
  static async unapprove (req, h) {
    // unapprove/withhold transaction for billing
    try {
      const regime = await SecurityCheckRegime.call(req.params.regime_id)

      await UnapproveTransaction.call(regime, req.params.id)

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
        method: 'PATCH',
        path: basePath + '/{id}/approve',
        handler: this.approve.bind(this)
      },
      {
        method: 'PATCH',
        path: basePath + '/{id}/unapprove',
        handler: this.unapprove.bind(this)
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
