// Pre-SRoC Transaction Queue =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const { logger } = require('../../lib/logger')
const SecurityCheckRegime = require('../../services/security_check_regime')
const SearchTransactionQueue = require('../../services/search_transaction_queue')
const AddTransaction = require('../../services/add_transaction')
const RemoveTransaction = require('../../services/remove_transaction')
const Schema = require('../../schema/pre_sroc')

const basePath = '/v1/{regime_id}/transaction_queue'

async function index (req, h) {
  try {
    // check regime valid and caller has access to regime
    // regime_id is part of routing so must be defined to get here
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    // load the correct schema for the regime
    const schema = Schema[regime.slug]

    // select all transactions matching search criteria for the regime (pre-sroc only)
    return SearchTransactionQueue.call(regime, schema, true, req.query)
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

async function create (req, h) {
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    // process and add transaction(s) in payload
    const payload = req.payload
    if (!payload) {
      // return HTTP 400
      return Boom.badRequest('No payload')
    }

    // load the correct schema for the regime
    const schema = Schema[regime.slug]

    // validate the payload
    const validData = schema.validateTransaction(payload)

    if (validData.error) {
      // get the better formatted message(s)
      const msg = validData.error.details.map(e => e.message).join(', ')

      // return HTTP 422
      return Boom.badData(msg)
    }

    // create the transaction
    const tId = await AddTransaction.call(regime, schema, validData, true)
    const result = {
      transaction: {
        id: tId
      }
    }

    // return HTTP 201 Created
    const response = h.response(result)
    response.code(201)
    response.header('Location', regimeTransactionPath(regime, tId))
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

async function remove (req, h) {
  // remove (delete) transaction
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)
    await RemoveTransaction.call(regime, req.params.id)

    // HTTP 204 No Content
    return h.response().code(204)
  } catch (err) {
    return Boom.boomify(err)
  }
}

function regimeTransactionPath (regime, transactionId) {
  return `${config.environment.serviceUrl}/v1/${regime.slug}/transactions/${transactionId}`
}

const routes = [
  {
    method: 'GET',
    path: basePath,
    handler: index
  },
  {
    method: 'POST',
    path: basePath,
    handler: create
  },
  {
    method: 'DELETE',
    path: `${basePath}/{id}`,
    handler: remove
  }
]

module.exports = {
  routes
}
