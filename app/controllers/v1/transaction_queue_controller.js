const path = require('path')
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const { logger } = require('../../lib/logger')
const utils = require('../../lib/utils')
const Security = require('../../lib/security')
const TransactionQueue = require('../../services/transaction_queue')

const basePath = '/v1/{regime_id}/transaction_queue'

async function index (req, h) {
  try {
    // check regime valid and caller has access to regime
    // regime_id is part of routing so must be defined to get here
    const regime = await Security.checkRegimeValid(req.params.regime_id)

    if (Boom.isBoom(regime)) {
      return regime
    }

    // select all transactions matching search criteria for the regime
    return TransactionQueue.search(regime, req.query)
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

async function create (req, h) {
  try {
    const regime = await Security.checkRegimeValid(req.params.regime_id)

    if (Boom.isBoom(regime)) {
      return regime
    }

    // process and add transaction(s) in payload
    const payload = req.payload
    if (!payload) {
      // return HTTP 400
      return Boom.badRequest('No payload')
    }

    // load the correct validator for the regime
    const validator = require(path.resolve(__dirname, `../../schema/${regime.slug}_transaction.js`))
    // validate the payload
    const validData = validator.validate(payload)

    if (validData.error) {
      // get the better formatted message(s)
      const msg = validData.error.details.map(e => e.message).join(', ')

      // return HTTP 422
      return Boom.badData(msg)
    }

    // translate regime naming scheme into DB schema
    const transData = validator.translate(validData)

    // add the association to the regime
    transData['regime_id'] = regime.id

    // create the transaction
    const tId = await TransactionQueue.addTransaction(transData)
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
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

async function remove (req, h) {
  // remove (delete) transaction
  try {
    const regime = await Security.checkRegimeValid(req.params.regime_id)

    if (Boom.isBoom(regime)) {
      return regime
    }
    const tId = req.params.id

    // postgres explodes if we don't pass a valid uuid in a query
    if (utils.isValidUUID(tId)) {
      const result = await TransactionQueue.removeTransaction(regime, tId)
      console.log(result)

      if (result !== 1) {
        // didn't remove a transaction matching the criteria
        return Boom.notFound(`No queued transaction found with id '${tId}'`)
      }

      // HTTP 204 No Content
      return h.response().code(204)
    } else {
      return Boom.notFound(`Transaction Id '${tId}' not found`)
    }
  } catch (err) {
    logger.error(err.stack)
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
