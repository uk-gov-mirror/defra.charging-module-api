// Pre-SRoC Bill Runs =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const { logger } = require('../../lib/logger')
const Authorisation = require('../../lib/authorisation')
const { dbError } = require('../../lib/db_error')
const AuthorisedSystem = require('../../models/authorised_system')

const basePath = '/admin/authorised_systems'

class AuthorisedSystemsController {
  // GET /v1/authorised_systems
  static async index (req, h) {
    try {
      // check caller is authenticated as admin
      Authorisation.assertAdminOnlyAccess(req.headers.authorization)

      // admin only, no need for searches as such a small number
      const result = await AuthorisedSystem.all()
      return {
        authorisedSystems: result
      }
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  // GET /v1/authorised_systems/{id}
  static async show (req, h) {
    try {
      // check caller is authenticated as admin
      Authorisation.assertAdminOnlyAccess(req.headers.authorization)

      const authSys = await AuthorisedSystem.find(req.params.id)

      return {
        authorisedSystem: authSys
      }
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  // Add a new authorised system
  // POST /v1/authorised_systems
  static async create (req, h) {
    try {
      // check caller is authenticated as admin
      Authorisation.assertAdminOnlyAccess(req.headers.authorization)

      const payload = req.payload
      if (!payload) {
        // return HTTP 400
        return Boom.badRequest('No payload')
      }

      const id = await AuthorisedSystem.add(payload)

      // return HTTP 201 Created
      const response = h.response({
        id
      })
      response.code(201)
      response.header('Location', this.authorisedSystemPath(id))
      return response
    } catch (err) {
      logger.error(err.stack)
      if (Boom.isBoom(err)) {
        // status 500 squashes error message for some reason
        if (err.output.statusCode === 500) {
          err.output.payload.message = err.message
        }
        return err
      } else if (err.isJoi) {
        return Boom.badData(err.details.map(e => e.message).join(', '))
      } else {
        // could be a database error
        const err2 = dbError(err)
        if (Boom.isBoom(err2)) {
          return err2
        }
        return Boom.boomify(err)
      }
    }
  }

  // PATCH /v1/authorised_systems/{id}
  static async update (req, h) {
    try {
      // check regime valid and caller has access to regime
      // regime_id is part of routing so must be defined to get here
      Authorisation.assertAdminOnlyAccess(req.headers.authorization)

      // expect a payload with updated name/status/authorisations - to remove all an empty array should be specified
      // changing authorisations does not only add, so will remove any already set but not in payload
      const payload = req.payload
      if (!payload) {
        // return HTTP 400
        return Boom.badRequest('No payload')
      }

      await AuthorisedSystem.update(req.params.id, req.payload)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  // DELETE /v1/authorised_systems/{id}
  static async remove (req, h) {
    try {
      Authorisation.assertAdminOnlyAccess(req.headers.authorization)

      await AuthorisedSystem.remove(req.params.id)

      // HTTP 204 No Content
      return h.response().code(204)
    } catch (err) {
      logger.error(err.stack)
      return Boom.boomify(err)
    }
  }

  static authorisedSystemPath (systemId) {
    return `${config.environment.serviceUrl}/v1/authorised_systems/${systemId}`
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
      },
      {
        method: 'POST',
        path: basePath,
        handler: this.create.bind(this)
      },
      {
        method: 'PATCH',
        path: `${basePath}/{id}`,
        handler: this.update.bind(this)
      },
      {
        method: 'DELETE',
        path: `${basePath}/{id}`,
        handler: this.remove.bind(this)
      }
    ]
  }
}

module.exports = AuthorisedSystemsController
