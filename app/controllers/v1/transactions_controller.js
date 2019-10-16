const Boom = require('@hapi/boom')
const Transaction = require('../../models/transaction')
const { logger } = require('../../lib/logger')
const utils = require('../../lib/utils')
const TransactionQueue = require('../../services/transaction_queue')
const Security = require('../../lib/security')
const Transactions = require('../../services/transactions')

const basePath = '/v1/{regime_id}/transactions'

async function index (req, h) {
  // check regime valid
  // select all transactions matching search criteria for the regime
  try {
    const regime = await Security.checkRegimeValid(req.params.regime_id)

    if (Boom.isBoom(regime)) {
      return regime
    }

    return Transaction.findByRegime(regime.id, req.params)
      .then(result => {
        return {
          pagination: result.pagination,
          data: {
            transactions: result.data.transactions
          }
        }
      })
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

async function show (req, h) {
  try {
    const regime = await Security.checkRegimeValid(req.params.regime_id)

    if (Boom.isBoom(regime)) {
      return regime
    }

    const tId = req.params.id
    if (utils.isValidUUID(tId)) {
      const transaction = await Transactions.find(regime, req.params.id)

      if (transaction.error) {
        return Boom.notFound(transaction.error)
      }

      return {
        transaction: transaction
      }
    } else {
      return Boom.notFound(`Transaction Id '${tId}' not found`)
    }

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

const routes = [
  {
    method: 'GET',
    path: basePath,
    handler: index
  },
  {
    method: 'GET',
    path: basePath + '/{id}',
    handler: show
  },
  {
    method: 'DELETE',
    path: basePath + '/{id}',
    handler: remove
  }
]

module.exports = {
  routes
}
