const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const Authorisation = require('../../lib/authorisation')
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
      req.log(['ERROR'], err.stack)
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
      req.log(['ERROR'], err.stack)
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
        method: 'GET',
        path: basePath + '/{id}',
        handler: this.show.bind(this)
      }
    ]
  }
}

module.exports = TransactionsController
