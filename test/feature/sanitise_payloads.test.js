'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code

// For running our service
const createServer = require('../../app')

// Test helpers
const RouteHelper = require('../helpers/route_helper')

const options = payload => {
  return {
    method: 'POST',
    url: '/test/post',
    payload: payload
  }
}

describe('Sanitizing requests to the API', () => {
  let server

  // Create server before each test
  before(async () => {
    server = await createServer()
    RouteHelper.addPublicPostRoute(server)
  })

  describe('When a payload includes characters like &, <, and >', () => {
    it('allows the original values to get through unescaped', async () => {
      const requestPayload = {
        reference: 'BESESAME001',
        customerName: 'Bert & Ernie <> Ltd'
      }

      const response = await server.inject(options(requestPayload))
      const responsePayload = JSON.parse(response.payload)

      expect(response.statusCode).to.equal(200)
      expect(responsePayload).to.equal(requestPayload)
    })
  })

  describe('When a payload has sub-properties including characters like &, <, and >', () => {
    it('allows the original values to get through unescaped', async () => {
      const requestPayload = {
        reference: 'BESESAME001',
        details: {
          customerName: 'Bert & Ernie <> Ltd',
          location: 'Bristol'
        }
      }

      const response = await server.inject(options(requestPayload))
      const responsePayload = JSON.parse(response.payload)

      expect(response.statusCode).to.equal(200)
      expect(responsePayload).to.equal(requestPayload)
    })
  })

  describe('When a payload includes malicious content', () => {
    it('it strips it out', async () => {
      const requestPayload = {
        reference: 'BESESAME001',
        customerName: '<script>alert(1)</script>'
      }

      const response = await server.inject(options(requestPayload))
      const responsePayload = JSON.parse(response.payload)

      expect(response.statusCode).to.equal(200)
      expect(responsePayload.customerName).to.equal('')
    })
  })
})
