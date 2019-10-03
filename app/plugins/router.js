const Boom = require('@hapi/boom')
const regimes = require('../controllers/v1/regimes_controller').routes
const transactions = require('../controllers/v1/transactions_controller').routes
const transactionQueue = require('../controllers/v1/transaction_queue_controller').routes
const srocTransactionQueue = require('../controllers/v1/sroc_transaction_queue_controller').routes

const routes = [
  ...regimes,
  ...transactions,
  ...transactionQueue,
  ...srocTransactionQueue,
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
