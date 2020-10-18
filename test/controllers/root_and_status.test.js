const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code

const createServer = require('../../app')

describe('Root endpoint: GET /', () => {
  let server

  // Create server before each test
  before(async () => {
    server = await createServer()
  })

  it('returns the correct response', async () => {
    const options = {
      method: 'GET',
      url: '/'
    }

    const response = await server.inject(options)
    const payload = JSON.parse(response.payload)

    expect(response.statusCode).to.equal(200)
    expect(payload.status).to.equal('alive')
  })
})

describe('Status endpoint: GET /status', () => {
  let server

  // Create server before each test
  before(async () => {
    server = await createServer()
  })

  it('returns the correct response', async () => {
    const options = {
      method: 'GET',
      url: '/status'
    }

    const response = await server.inject(options)
    const payload = JSON.parse(response.payload)

    expect(response.statusCode).to.equal(200)
    expect(payload.status).to.equal('alive')
  })
})
