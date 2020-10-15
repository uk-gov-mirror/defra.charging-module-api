const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code
const createServer = require('../../app')
const { cleanCustomerChanges } = require('../helpers/customer_helper')
const { makeAdminAuthHeader } = require('../helpers/authorisation_helper')

describe('Customer changes controller: POST /v1/wrls/customer_changes', () => {
  let server
  let authToken

  // Create server before the tests run
  before(async () => {
    server = await createServer()
    authToken = makeAdminAuthHeader()
    await cleanCustomerChanges()
  })

  it('adds a customer change to the queue', async () => {
    const options = {
      method: 'POST',
      url: '/v1/wrls/customer_changes',
      headers: { authorization: authToken },
      payload: {
        region: 'A',
        customerReference: 'AB123456A',
        customerName: 'Jobbie Breakers Ltd',
        addressLine1: '11a Bog Lane',
        addressLine5: 'Big Town',
        addressLine6: 'Trumptonshire',
        postcode: 'BG1 0JB'
      }
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(201)
  })

  it('does not add a customer change with invalid data', async () => {
    const options = {
      method: 'POST',
      headers: { authorization: authToken },
      url: '/v1/wrls/customer_changes',
      payload: {
        region: 'A',
        bananas: 'AB123456A',
        peanut: 'Jobbie Breakers Ltd',
        postcode: 'BG1 0JB'
      }
    }
    const response = await server.inject(options)
    expect(response.statusCode).to.equal(422)
  })
})
