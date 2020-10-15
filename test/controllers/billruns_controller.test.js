const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code
const createServer = require('../../app')
const { cleanTransactions } = require('../helpers/transaction_helper')
const { makeAdminAuthHeader } = require('../helpers/authorisation_helper')

describe('Billruns controller: POST /v1/wrls/billruns', () => {
  let server

  // Create server before each test
  before(async () => {
    server = await createServer()
    await cleanTransactions()
  })

  it('creates a new bill run for the specified region', async () => {
    const options = {
      method: 'POST',
      url: '/v1/wrls/billruns',
      headers: { authorization: makeAdminAuthHeader() },
      payload: {
        region: 'A'
      }
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(201)
    const payload = JSON.parse(response.payload)
    expect(payload.billRun.id).to.exist()
    expect(payload.billRun.billRunNumber).to.exist()
  })
})
