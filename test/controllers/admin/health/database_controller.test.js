// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code

// For running our service
const createServer = require('../../../../app')

// Test helpers
const { makeAdminAuthHeader } = require('../../../helpers/authorisation_helper')

describe('Database controller: GET /admin/health/database', () => {
  let server
  let authToken

  before(async () => {
    server = await createServer()
    authToken = makeAdminAuthHeader()
  })

  it('returns stats about each table', async () => {
    const options = {
      method: 'GET',
      url: '/admin/health/database',
      headers: { authorization: authToken }
    }

    const response = await server.inject(options)
    const payload = JSON.parse(response.payload)

    expect(response.statusCode).to.equal(200)
    expect(payload).to.be.an.object()
    expect(payload).to.include('tableStats')
  })

  it('returns a 401 error without proper authentication', async () => {
    const options = {
      method: 'GET',
      url: '/admin/health/airbrake'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(401)
  })
})
