const Boom = require('@hapi/boom')
// const Transaction = require('../../models/transaction')
const { logger } = require('../../lib/logger')
// const SecurityCheckRegime = require('../../services/security_check_regime')
const Authorisation = require('../../lib/authorisation')
const FindTransaction = require('../../services/find_transaction')
const Schema = require('../../schema/pre_sroc')
const SearchCollection = require('../../services/search_collection')

const basePath = '/v1/{regime_id}/billed_transactions'

async function index (req, h) {
  try {
    // check regime valid and caller has access to regime
    // regime_id is part of routing so must be defined to get here
    // const regime = await SecurityCheckRegime.call(req.params.regime_id)
    const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

    // load the correct schema for the regime
    const searchRequest = new (Schema[regime.slug].BilledTransactionsRequest)(regime.id, req.query)

    // const { page, perPage, sort, sortDir, ...q } = req.query

    // translate params into DB naming
    // const params = Transaction.translate(q)
    // force these criteria
    // params.status = 'billed'
    // params.regime_id = regime.id
    // params.pre_sroc = 'true'
    return SearchCollection.call(searchRequest)
    // select all transactions matching search criteria for the regime (pre-sroc only)
    // return Transaction.search(params, page, perPage, sort, sortDir)
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
    handler: index
  },
  {
    method: 'GET',
    path: basePath + '/{id}',
    handler: show
  }
]

module.exports = {
  routes
}
