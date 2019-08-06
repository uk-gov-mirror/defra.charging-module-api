const hapi = require('@hapi/hapi')
const config = require('../config/config')

async function createServer () {
  // Create the hapi server
  const server = hapi.server(config.server)

  // Register the plugins
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/airbrake'))

  if (config.environment.development) {
    await server.register(require('blipp'))
    await server.register(require('./plugins/logging'))
  }

  return server
}

module.exports = createServer
