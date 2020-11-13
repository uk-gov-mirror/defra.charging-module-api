const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code
const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const { createTransaction, cleanTransactions } = require('../helpers/transaction_helper')
const { makeAdminAuthHeader } = require('../helpers/authorisation_helper')

describe('Transactions controller: GET /v1/wrls/transactions', () => {
  let server
  let authToken

  // Create server before the tests run
  before(async () => {
    server = await createServer()
    authToken = makeAdminAuthHeader()
    await cleanTransactions()
  })

  it('returns list of transactions', async () => {
    const options = {
      method: 'GET',
      url: '/v1/wrls/transactions',
      headers: { authorization: authToken }
    }
    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.headers['content-type']).to.include('application/json')
    const payload = JSON.parse(response.payload)
    expect(Object.keys(payload)).to.equal(['pagination', 'data'])
  })
})

describe('Transactions controller: GET /v1/wrls/transactions/id', () => {
  let server
  let regime
  let authToken

  // Create server before the tests run
  before(async () => {
    server = await createServer()
    regime = await Regime.find('wrls')
    authToken = makeAdminAuthHeader()
    await cleanTransactions()
  })

  it('returns transaction', async () => {
    const id = await createTransaction(regime.id, false)

    const options = {
      method: 'GET',
      url: `/v1/wrls/transactions/${id}`,
      headers: { authorization: authToken }
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.headers['content-type']).to.include('application/json')
    const payload = JSON.parse(response.payload)
    expect(payload.transaction.id).to.equal(id)
  })

  it('returns 404 when id not found', async () => {
    const options = {
      method: 'GET',
      url: '/v1/wrls/transactions/deadbeef-0914-44f7-80ad-666ef0df67e0',
      headers: { authorization: authToken }
    }
    const response = await server.inject(options)
    expect(response.statusCode).to.equal(404)
    expect(response.headers['content-type']).to.include('application/json')
    const payload = JSON.parse(response.payload)
    expect(payload).to.include(['statusCode', 'error', 'message'])
  })
})
