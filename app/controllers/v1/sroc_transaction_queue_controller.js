const Boom = require('@hapi/boom')
const { logger } = require('../../lib/logger')
const SecurityCheckRegime = require('../../services/security_check_regime')
// const TransactionQueue = require('../../services/transaction_queue')

const basePath = '/v1/{regime_id}/sroc_transaction_queue'

async function index (req, h) {
  try {
    // check regime valid and caller has access to regime
    // regime_id is part of routing so must be defined to get here
    const regime = await SecurityCheckRegime.call(req.params.regime_id)
    return regime
    // select all transactions matching search criteria for the regime
    // return TransactionQueue.srocSearch(regime.id, req.query)
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

function create (req, h) {
  return { eggs: 'cheese' }
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
  }
]

module.exports = {
  routes
}
