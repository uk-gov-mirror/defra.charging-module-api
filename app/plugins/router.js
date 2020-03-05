const Boom = require('@hapi/boom')
const regimes = require('../controllers/v1/regimes_controller').routes
const transactions = require('../controllers/v1/transactions_controller').routes
const transactionQueue = require('../controllers/v1/transaction_queue_controller').routes
const billedTransactions = require('../controllers/v1/billed_transactions_controller').routes
const srocTransactionQueue = require('../controllers/v1/sroc_transaction_queue_controller').routes
const calculateCharge = require('../controllers/v1/calculate_charge_controller').routes
const srocCalculateCharge = require('../controllers/v1/sroc_calculate_charge_controller').routes
const billRuns = require('../controllers/v1/billruns_controller').routes
const customerChanges = require('../controllers/v1/customer_changes_controller').routes
const customerFiles = require('../controllers/v1/customer_files_controller').routes

const status = (request, h) => request.headers

const routes = [
  ...regimes,
  ...transactions,
  ...transactionQueue,
  ...billedTransactions,
  ...srocTransactionQueue,
  ...calculateCharge,
  ...srocCalculateCharge,
  ...billRuns,
  ...customerChanges,
  ...customerFiles,
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

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
