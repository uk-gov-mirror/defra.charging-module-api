const Boom = require('@hapi/boom')
const { logger } = require('../../../lib/logger')
const Authorisation = require('../../../lib/authorisation')

class AirbrakeController {
  static async index (req, _h) {
    // We want to handle the error properly when it comes to authentication
    try {
      Authorisation.assertAdminOnlyAccess(req.headers.authorization)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }

    // With authentication out of the way we can now through raise our errors
    // and check Airbrake is working ok.
    req.server.methods.notify(
      new Error('Airbrake test error - manual'),
      { message: 'Use me to log other events' }
    )
    throw new Error('Airbrake test error - automatic')
  }

  static routes () {
    return [
      {
        method: 'GET',
        path: '/admin/health/airbrake',
        handler: this.index.bind(this)
      }
    ]
  }
}

module.exports = AirbrakeController
