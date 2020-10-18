const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code
const createServer = require('../../../app')
const Regime = require('../../../app/models/regime')
const { makeAdminAuthHeader } = require('../../helpers/authorisation_helper')

describe('Regimes controller: GET /v1/regimes', async () => {
  let server
  let regimes
  let mappedRegimes
  let authToken

  // Create server before each test
  before(async () => {
    server = await createServer()
    const result = await Regime.all()
    regimes = result.regimes
    mappedRegimes = regimes // .map(({ slug, name }) => { return { id: slug, name } })
    authToken = makeAdminAuthHeader()
  })

  it('returns regimes', async () => {
    const options = {
      method: 'GET',
      url: '/admin/regimes',
      headers: { authorization: authToken }
    }
    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.headers['content-type']).to.include('application/json')
    const payload = JSON.parse(response.payload)
    expect(payload.regimes.length).to.equal(mappedRegimes.length)
  })
})

describe('Regimes controller: GET /v1/regimes/{id}', async () => {
  let server
  let regimes
  let mappedRegimes
  let authToken

  // Create server before each test
  before(async () => {
    server = await createServer()
    const result = await Regime.all()
    regimes = result.regimes
    mappedRegimes = regimes // .map(({ slug, name }) => { return { id: slug, name } })
    authToken = makeAdminAuthHeader()
  })

  it('returns a regime', async () => {
    for (let i = 0; i < regimes.length; i++) {
      const regime = mappedRegimes[i]
      const options = {
        method: 'GET',
        url: `/admin/regimes/${regime.slug}`,
        headers: { authorization: authToken }
      }
      const response = await server.inject(options)
      expect(response.statusCode).to.equal(200)
      expect(response.headers['content-type']).to.include('application/json')
      const payload = JSON.parse(response.payload)
      expect(payload.regime.id).to.equal(regime.id)
      expect(payload.regime.slug).to.equal(regime.slug)
    }
  })

  it('returns status 404 when id not found', async () => {
    const options = {
      method: 'GET',
      url: '/admin/regimes/wigwam',
      headers: { authorization: authToken }
    }
    const response = await server.inject(options)
    expect(response.statusCode).to.equal(404)
    expect(JSON.parse(response.payload).error).to.equal('Not Found')
  })
})
