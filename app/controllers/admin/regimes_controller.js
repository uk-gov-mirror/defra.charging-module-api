const Boom = require('@hapi/boom')
const Regime = require('../../models/regime')
const Authorisation = require('../../lib/authorisation')

const basePath = '/admin/regimes'

class RegimesController {
  // GET /v1/regimes
  static async index (req, h) {
    try {
      Authorisation.assertAdminOnlyAccess(req.headers.authorization)
      const regimes = await Regime.all()
      return regimes
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  // GET /v1/regimes/{id}
  static async show (req, h) {
    try {
      Authorisation.assertAdminOnlyAccess(req.headers.authorization)
      const regime = await Regime.find(req.params.id)
      if (regime === null) {
        return Boom.notFound('No matching regime found')
      }
      return {
        regime: regime
      }
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  static routes () {
    return [
      {
        method: 'GET',
        path: basePath,
        handler: this.index.bind(this)
      },
      {
        method: 'GET',
        path: `${basePath}/{id}`,
        handler: this.show.bind(this)
      }
    ]
  }
}

module.exports = RegimesController
