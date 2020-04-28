const Boom = require('@hapi/boom')
const Regime = require('../../models/regime')
const { logger } = require('../../lib/logger')
const Authorisation = require('../../lib/authorisation')

const basePath = '/v1/regimes'

async function index (req, h) {
  try {
    Authorisation.assertAdminOnlyAccess(req.headers.authorization)
    const regimes = await Regime.all()
    return regimes
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

async function show (req, h) {
  try {
    Authorisation.assertAdminOnlyAccess(req.headers.authorization)
    const regime = await Regime.find(req.params.id)
    if (regime === null) {
      return Boom.notFound(`No matching regime found`)
    }
    return {
      regime: regime
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
