'use strict'

/**
 * A helper that provides test routes.
 *
 * When testing you might need to add a route for which you control its config and options, for example, testing of
 * sanitising requests.
 *
 * Use this helper to access routes that can be added to the server as part of your tests.
 */
class RouteHelper {
  /**
   * Adds a POST route to a Hapi server instance which will return whatever was in the payload
   *
   * Intended for testing plugins which may alter a payload before a controller has visibility of it.
   *
   * @param {Object} server A Hapi server instance
   */
  static addPublicPostRoute (server) {
    server.route({
      method: 'POST',
      path: '/test/post',
      handler: (request, _h) => {
        return request.payload
      }
    })
  }
}

module.exports = RouteHelper
