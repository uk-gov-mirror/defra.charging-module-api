const AirbrakeClient = require('airbrake-js')
const config = require('../../config/config')

const airbrake = new AirbrakeClient(config.airbrake)

module.exports = {
  plugin: {
    name: 'airbrake',
    register: (server, options) => {
      server.events.on({ name: 'request', channels: 'error' }, (req, event, tags) => {
        airbrake.notify({
          error: event.error,
          context: {
            userAddr: req.info.remoteAddress,
            userAgent: req.headers['user-agent'],
            url: req.url.href,
            route: req.route.path,
            httpMethod: req.method,
            component: 'hapi',
            action: req.route.settings.handler.name
          }
        })
      })
    }
  }
}
