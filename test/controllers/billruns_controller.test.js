'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code

// For running our service
const createServer = require('../../app')

// Test helpers
const Regime = require('../../app/models/regime')
const { cleanBillRuns, createBillRun } = require('../helpers/bill_run_helper')
const { createTransaction, cleanTransactions } = require('../helpers/transaction_helper')
const { makeAdminAuthHeader } = require('../helpers/authorisation_helper')

describe('Billruns controller', () => {
  let server
  let authToken
  let regime

  before(async () => {
    regime = await Regime.find('wrls')
    server = await createServer()
    authToken = makeAdminAuthHeader()
  })

  beforeEach(async () => {
    await cleanTransactions()
    await cleanBillRuns()
  })

  describe('Adding a bill run: POST /v1/wrls/billruns', () => {
    const options = (payload, bearerToken) => {
      return {
        method: 'POST',
        url: '/v1/wrls/billruns',
        headers: { authorization: bearerToken },
        payload: payload
      }
    }

    it('creates a new bill run for the specified region', async () => {
      const requestPayload = {
        region: 'A'
      }

      const response = await server.inject(options(requestPayload, authToken))
      const responsePayload = JSON.parse(response.payload)

      expect(response.statusCode).to.equal(201)
      expect(responsePayload.billRun.id).to.exist()
      expect(responsePayload.billRun.billRunNumber).to.exist()
    })
  })

  describe('Sending a bill run: POST /v1/wrls/billruns/{billRunId}/send', () => {
    const options = (billRunId, bearerToken) => {
      return {
        method: 'POST',
        url: `/v1/wrls/billruns/${billRunId}/send`,
        headers: { authorization: bearerToken }
      }
    }

    it('creates a new bill run for the specified region', async () => {
      const billRunId = await createBillRun(regime.id, 'A', { approved_for_billing: true })
      await createTransaction(regime.id, false, { bill_run_id: billRunId, approved_for_billing: true })

      const response = await server.inject(options(billRunId, authToken))
      const responsePayload = JSON.parse(response.payload)

      expect(response.statusCode).to.equal(200)
      expect(responsePayload.billRun.id).to.exist()
      expect(responsePayload.billRun.billRunNumber).to.exist()
    })
  })

  describe('Sending a bill run: PATCH /v1/wrls/billruns/{billRunId}/send', () => {
    const options = (billRunId, bearerToken) => {
      return {
        method: 'PATCH',
        url: `/v1/wrls/billruns/${billRunId}/send`,
        headers: { authorization: bearerToken }
      }
    }

    it('creates a new bill run for the specified region', async () => {
      const billRunId = await createBillRun(regime.id, 'A', { approved_for_billing: true })
      await createTransaction(regime.id, false, { bill_run_id: billRunId, approved_for_billing: true })

      const response = await server.inject(options(billRunId, authToken))
      const responsePayload = JSON.parse(response.payload)

      expect(response.statusCode).to.equal(200)
      expect(responsePayload.billRun.id).to.exist()
      expect(responsePayload.billRun.billRunNumber).to.exist()
    })
  })
})
