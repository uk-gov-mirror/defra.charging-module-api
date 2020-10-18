const Boom = require('@hapi/boom')
const regimes = require('../controllers/admin/regimes_controller').routes()
const authorisedSystems = require('../controllers/admin/authorised_systems_controller').routes()
const transactions = require('../controllers/v1/transactions_controller').routes()
const calculateCharge = require('../controllers/v1/calculate_charge_controller').routes()
const billRuns = require('../controllers/v1/billruns_controller').routes()
const billRunTransactions = require('../controllers/v1/billrun_transactions_controller').routes()
const customerChanges = require('../controllers/v1/customer_changes_controller').routes()
const customerFiles = require('../controllers/v1/customer_files_controller').routes()

const airbrake = require('../controllers/airbrake_controller').routes()

const status = (request, h) => request.headers

const routes = [
  ...regimes,
  ...authorisedSystems,
  ...transactions,
  ...calculateCharge,
  ...billRuns,
  ...billRunTransactions,
  ...customerChanges,
  ...customerFiles,
  ...airbrake,
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
    register: (server, _options) => {
      server.route(routes)
    }
  }
}
