const Boom = require('@hapi/boom')
const regimes = require('../controllers/v1/regimes_controller').routes
const transactions = require('../controllers/v1/transactions_controller').routes()
// const transactionQueue = require('../controllers/v1/transaction_queue_controller').routes
const billedTransactions = require('../controllers/v1/billed_transactions_controller').routes
const srocTransactionQueue = require('../controllers/v1/sroc_transaction_queue_controller').routes
const calculateCharge = require('../controllers/v1/calculate_charge_controller').routes
const srocCalculateCharge = require('../controllers/v1/sroc_calculate_charge_controller').routes
const billRuns = require('../controllers/v1/billruns_controller').routes()
const billRunTransactions = require('../controllers/v1/billrun_transactions_controller').routes()
const customerChanges = require('../controllers/v1/customer_changes_controller').routes
const customerFiles = require('../controllers/v1/customer_files_controller').routes
const authorisedSystems = require('../controllers/v1/authorised_systems_controller').routes()
const config = require('../../config/config')

const status = (request, h) => request.headers

const routes = [
  ...regimes,
  ...transactions,
  // ...transactionQueue,
  ...billedTransactions,
  ...srocTransactionQueue,
  ...calculateCharge,
  ...srocCalculateCharge,
  ...billRuns,
  ...billRunTransactions,
  ...customerChanges,
  ...customerFiles,
  ...authorisedSystems,
  {
    method: 'GET',
    path: '/status',
    handler: status
  },
  {
    method: 'GET',
    path: '/',
    handler: status
  },
  {
    method: '*',
    path: '/{any*}',
    handler: (request, h) => {
      return Boom.notFound()
    }
  }
]

// Returns true if route contains a tag in tagList
// Also returns true if taglist contains '*' to match all endpoints
function routeHasTag (route, tagList) {
  return tagList.includes('*') || (route.options && route.options.tags && route.options.tags.some(tag => tagList.includes(tag)))
}

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      // Allow routes, allow list and deny list to be passed through as options to help with testing
      const routesToRegister = options && options.routes ? options.routes : routes
      const routeTagAllowList = options && options.routeTagAllowList ? options.routeTagAllowList : config.routeTagAllowList
      const routeTagDenyList = options && options.routeTagDenyList ? options.routeTagDenyList : config.routeTagDenyList

      server.route(routesToRegister
        .filter(route => routeHasTag(route, routeTagAllowList))
        .filter(route => !routeHasTag(route, routeTagDenyList))
      )
    }
  }
}
