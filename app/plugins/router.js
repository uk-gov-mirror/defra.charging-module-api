const Boom = require('@hapi/boom')
const regimeRoutes = require('../controllers/v1/regimes_controller').routes

const routes = [
  ...regimeRoutes,
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
