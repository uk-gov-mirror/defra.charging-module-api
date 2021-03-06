'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { describe, it, before, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code

// For running our service
const createServer = require('../../app')

// Things we need to stub
const RuleService = require('../../app/lib/connectors/rules')

// Test helpers
const Regime = require('../../app/models/regime')
const Schema = require('../../app/schema/pre_sroc')
const { addTransaction, createTransaction, cleanTransactions } = require('../helpers/transaction_helper')
const { createBillRun, cleanBillRuns } = require('../helpers/bill_run_helper')
const { makeAdminAuthHeader } = require('../helpers/authorisation_helper')

// Fixtures
const { dummyCharge } = require('../helpers/charge_helper')
const {
  StandardTransactionRequest,
  InvalidTransactionRequest
} = require('../fixtures/transaction_requests')

describe('Billrun Transactions controller', () => {
  let server
  let authToken
  let regime
  let schema

  before(async () => {
    regime = await Regime.find('wrls')
    schema = Schema[regime.slug]
    server = await createServer()
    authToken = makeAdminAuthHeader()
  })

  beforeEach(async () => {
    await cleanTransactions()
    await cleanBillRuns()
  })

  afterEach(async () => {
    Sinon.restore()
  })

  describe('Adding a transaction: POST /v1/{regimeId}/billrun/{billRunId}/transaction', () => {
    const options = (billRunId, payload, bearerToken) => {
      return {
        method: 'POST',
        url: `/v1/wrls/billruns/${billRunId}/transactions`,
        headers: { authorization: bearerToken },
        payload: payload
      }
    }

    it('adds a transaction', async () => {
      const stub = Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge())
      const billRunId = await createBillRun(regime.id, 'A')
      const response = await server.inject(options(billRunId, StandardTransactionRequest(), authToken))

      expect(stub.called).to.be.true()
      expect(response.statusCode).to.equal(201)
    })

    it('will not add a transaction with invalid data', async () => {
      const billRunId = await createBillRun(regime.id, 'A')
      const response = await server.inject(options(billRunId, InvalidTransactionRequest(), authToken))

      expect(response.statusCode).to.equal(422)
    })

    it('will add a transaction that generates a zero charge', async () => {
      const stub = Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge({ chargeValue: 0 }))
      const billRunId = await createBillRun(regime.id, 'A')
      const response = await server.inject(options(billRunId, StandardTransactionRequest(), authToken))

      expect(stub.called).to.be.true()
      expect(response.statusCode).to.equal(201)
    })

    it("will not add a transaction where the region doesn't match the bill run", async () => {
      const billRunId = await createBillRun(regime.id, 'B')
      const response = await server.inject(options(billRunId, StandardTransactionRequest(), authToken))

      expect(response.statusCode).to.equal(422)
    })

    it("will not add a transaction where the bill run is 'sent'", async () => {
      const billRunId = await createBillRun(regime.id, 'A', { status: 'pending' })
      const response = await server.inject(options(billRunId, StandardTransactionRequest(), authToken))

      expect(response.statusCode).to.equal(400)
    })

    it('populates and returns client_id if no transaction with this id exists', async () => {
      Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge())
      const clientId = 'abc123'
      const billRunId = await createBillRun(regime.id, 'A')

      const response = await server.inject(options(billRunId, StandardTransactionRequest({ clientId }), authToken))
      // Reload transaction from database
      const payload = JSON.parse(response.payload)
      const transaction = await (schema.Transaction).find(regime.id, payload.transaction.id)

      expect(transaction.client_id).to.equal(clientId)
      expect(payload.transaction.clientId).to.equal(clientId)
    })

    it("leaves client_id database field empty and doesn't return anything for it if it is not specified", async () => {
      Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge())
      const billRunId = await createBillRun(regime.id, 'A')

      const response = await server.inject(options(billRunId, StandardTransactionRequest(), authToken))
      const payload = JSON.parse(response.payload)
      // Reload transaction from database
      const transaction = await (schema.Transaction).find(regime.id, payload.transaction.id)

      expect(transaction.client_id).to.equal(null)
      expect(payload.transaction.clientId).to.not.exist()
    })

    it('returns 409 response if client_id is specified and exists', async () => {
      const clientId = 'abc123'
      const billRunId = await createBillRun(regime.id, 'A')
      const tId = await addTransaction(regime, { clientId })

      const response = await server.inject(options(billRunId, StandardTransactionRequest({ clientId }), authToken))
      const payload = JSON.parse(response.payload)

      expect(response.statusCode).to.equal(409)
      expect(payload.id).to.equal(tId)
      expect(payload.clientId).to.equal(clientId)
    })
  })

  describe('Deleting a transaction: DELETE /v1/{regimeId/billrun/{billRunId}/transaction/{transactionId}', () => {
    const options = (billRunId, transactionId, bearerToken) => {
      return {
        method: 'DELETE',
        url: `/v1/wrls/billruns/${billRunId}/transactions/${transactionId}`,
        headers: { authorization: bearerToken }
      }
    }

    it('will delete the transaction', async () => {
      const billRunId = await createBillRun(regime.id, 'A')
      const transactionId = await createTransaction(regime.id, false, { bill_run_id: billRunId })
      const response = await server.inject(options(billRunId, transactionId, authToken))

      expect(response.statusCode).to.equal(204)
    })

    it("will not delete a transaction where the bill run ID's don't match", async () => {
      const billRunId = await createBillRun(regime.id, 'A')

      // Try to insert the transaction with a bill run ID that does not exist will cause a foreign key constraint error.
      // So we need to create a second bill run just to get a valid ID we can use for this test.
      const wrongBillRunId = await createBillRun(regime.id, 'B')
      const transactionId = await createTransaction(regime.id, false, { bill_run_id: wrongBillRunId })

      const response = await server.inject(options(billRunId, transactionId, authToken))

      expect(response.statusCode).to.equal(404)
    })

    it("will not delete a transaction where the bill run is 'billed'", async () => {
      const billRun = await createBillRun(regime.id, 'A', { status: 'billed' })
      const transactionId = await createTransaction(regime.id, false, { bill_run_id: billRun.id })
      const response = await server.inject(options(billRun.id, transactionId, authToken))

      expect(response.statusCode).to.equal(400)
    })
  })
})
