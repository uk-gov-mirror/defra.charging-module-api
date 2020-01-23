const hapi = require('@hapi/hapi')
const config = require('../config/config')
// const scheduler = require('./lib/scheduler')

async function createServer () {
  // Create the hapi server
  const server = hapi.server(config.server)

  // Register the plugins
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/airbrake'))
  await server.register(require('./plugins/scheduler'))

  if (config.environment.development) {
    await server.register(require('blipp'))
    await server.register(require('./plugins/logging'))
  }

  // scheduler.start()

  return server
}

module.exports = createServer
