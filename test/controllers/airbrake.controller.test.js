// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code

// For running our service
const createServer = require('../../app')

// Test helpers
const { makeAdminAuthHeader } = require('../helpers/authorisation_helper')

// Things we need to stub
const Airbrake = require('@airbrake/node')

describe('Airbrake controller: GET /status/airbrake', () => {
  let server
  let authToken

  before(async () => {
    server = await createServer()
    authToken = makeAdminAuthHeader()
  })

  it('returns a 500 error', async () => {
    const options = {
      method: 'GET',
      url: '/status/airbrake',
      headers: { authorization: authToken }
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(500)
  })

  it('causes Airbrake to send a notification', async () => {
    const options = {
      method: 'GET',
      url: '/status/airbrake',
      headers: { authorization: authToken }
    }

    // We stub Airbrake in the test as currently this is the only test using it
    const airbrakeStub = Sinon
      .stub(Airbrake.Notifier.prototype, 'notify')
      .resolves({ id: 1 })

    await server.inject(options)

    expect(airbrakeStub.called).to.equal(true)

    airbrakeStub.restore()
  })
})
