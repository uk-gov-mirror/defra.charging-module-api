const Boom = require('@hapi/boom')
const { logger } = require('../../lib/logger')
const Authorisation = require('../../lib/authorisation')
const FindTransaction = require('../../services/find_transaction')
const Schema = require('../../schema/pre_sroc')
const SearchCollection = require('../../services/search_collection')

const basePath = '/v1/{regime_id}/billed_transactions'

async function index (req, h) {
  try {
    // check regime valid and caller has access to regime
    // regime_id is part of routing so must be defined to get here
    const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

    // load the correct schema for the regime
    const searchRequest = new (Schema[regime.slug].BilledTransactionsRequest)(regime.id, req.query)

    return SearchCollection.call(searchRequest)
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

//
// GET /v1/{regime_id}/transactions/{id}
//
async function show (req, h) {
  try {
    const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

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

const routes = [
  {
    method: 'GET',
    path: basePath,
    handler: index,
    options: {
      tags: ['sroc']
    }
  },
  {
    method: 'GET',
    path: basePath + '/{id}',
    handler: show,
    options: {
      tags: ['sroc']
    }
  }
]

module.exports = {
  routes
}
