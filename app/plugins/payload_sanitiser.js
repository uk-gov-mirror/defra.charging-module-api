'use strict'

/**
 * @module PayloadSanitiserPlugin
 */

const ObjectSanitisingService = require('../services/object_sanitising_service')

/**
 * Loop through a request's payload and 'sanitise' it.
 *
 * When a request payload comes in there are a number of things we want to do to it's values
 *
 * - handle anything malicious
 * - protect non-string values like booleans and numbers
 *
 * By doing this we protect our service from XSS attacks whilst still ensuring the request gets through to our
 * endpoints.
 *
 * This plugin handles this for us.
 *
 * @see {module:ObjectSanitisingService}
 *
 */
const PayloadSanitiserPlugin = {
  name: 'payload_sanitiser',
  register: (server, _options) => {
    server.ext('onPostAuth', (request, h) => {
      if (!request.payload) {
        return h.continue
      }

      request.payload = ObjectSanitisingService.go(request.payload)

      return h.continue
    })
  }
}

module.exports = PayloadSanitiserPlugin
