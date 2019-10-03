const Boom = require('@hapi/boom')
const Regime = require('../../models/regime')
const Transaction = require('../../models/transaction')
const { logger } = require('../../lib/logger')

const basePath = '/v1/{regime_id}/transactions'

async function index (req, h) {
  // check regime valid
  // select all transactions matching search criteria for the regime
  try {
    // regime_id is part of routing so must be defined to get here
    const slug = req.params.regime_id

    const regime = await Regime.find(slug)
    // TODO: Security check user is able to access this regime
    if (!regime) {
      return Boom.notFound(`Regime '${slug}' not found`)
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

function show (req, h) {
  return Transaction.find(req.params.id)
    .then(result => {
      if (result) {
        return {
          data: {
            regime: mapRegimeItem(result)
          }
        }
      } else {
        return Boom.notFound()
      }
    }).catch(err => {
      logger.error(err.stack)
      return Boom.boomify(err)
    })
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
