const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code
const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const RuleService = require('../../app/lib/connectors/rules')
const { dummyCharge, zeroCharge } = require('../helpers/charge_helper')
const { addTransaction, updateTransaction, cleanTransactions } = require('../helpers/transaction_helper')
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

describe('Transactions controller: POST /v1/wrls/transaction', () => {
  let server
  let authToken

  // Create server before the tests run
  before(async () => {
    server = await createServer()
    authToken = makeAdminAuthHeader()
    await cleanTransactions()
  })

  it('adds a transaction', async () => {
    const options = {
      method: 'POST',
      url: '/v1/wrls/transactions',
      headers: { authorization: authToken },
      payload: {
        periodStart: '01-APR-2019',
        periodEnd: '31-MAR-2020',
        credit: false,
        billableDays: 230,
        authorisedDays: 240,
        volume: '3.5865',
        source: 'Supported',
        season: 'Summer',
        loss: 'Low',
        twoPartTariff: false,
        compensationCharge: true,
        eiucSource: 'Tidal',
        waterUndertaker: false,
        regionalChargingArea: 'Anglian',
        section127Agreement: false,
        section130Agreement: false,
        customerReference: 'TH12345678',
        lineDescription: 'Drains within Littleport & Downham IDB',
        licenceNumber: '123/456/26/*S/0453/R01',
        chargePeriod: '01-APR-2018 - 31-MAR-2019',
        chargeElementId: '',
        batchNumber: 'TEST-Transaction',
        region: 'A',
        areaCode: 'ARCA'
      }
    }

    const stub = Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge())
    const response = await server.inject(options)

    const stubCalled = stub.called
    stub.restore()
    expect(stubCalled).to.be.true()
    expect(response.statusCode).to.equal(201)
  })

  it('does not add a transaction with invalid data', async () => {
    const options = {
      method: 'POST',
      url: '/v1/wrls/transactions',
      headers: { authorization: authToken },
      payload: {
        transaction_date: '20-Jul-2018',
        invoice_date: '20-Jul-2018',
        line_description: 'Drains within Littleport & Downham IDB',
        licence_number: '6/33/26/*S/0453/R01',
        charge_period: '01-APR-2018 - 31-MAR-2019',
        prorata_days: '214/214',
        batch_number: 'B1',
        volume: '3.5865 Ml',
        region: 'A',
        area_code: 'ARCA',
        credit: true
      }
    }
    const response = await server.inject(options)
    expect(response.statusCode).to.equal(422)
  })

  it('does add a transaction that generates a zero charge', async () => {
    const options = {
      method: 'POST',
      url: '/v1/wrls/transactions',
      headers: { authorization: authToken },
      payload: {
        periodStart: '01-APR-2019',
        periodEnd: '31-MAR-2020',
        credit: false,
        billableDays: 230,
        authorisedDays: 240,
        volume: '3.5865',
        source: 'Supported',
        season: 'Summer',
        loss: 'Low',
        twoPartTariff: false,
        compensationCharge: true,
        eiucSource: 'Tidal',
        waterUndertaker: false,
        regionalChargingArea: 'Midlands',
        section127Agreement: false,
        section130Agreement: false,
        customerReference: 'TH12345678',
        lineDescription: 'Drains within Littleport & Downham IDB',
        licenceNumber: '123/456/26/*S/0453/R01',
        chargePeriod: '01-APR-2018 - 31-MAR-2019',
        chargeElementId: '',
        batchNumber: 'TEST-Transaction-Queue',
        region: 'B',
        areaCode: 'ARCA'
      }
    }

    const stub = Sinon.stub(RuleService, 'calculateCharge').resolves(zeroCharge())
    const response = await server.inject(options)

    const stubCalled = stub.called
    stub.restore()
    expect(stubCalled).to.be.true()
    expect(response.statusCode).to.equal(201)
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
    const id = await addTransaction(regime)

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

describe('Transactions controller: PATCH /v1/wrls/transactions/id/approve', () => {
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

  it('sets the approved for billing flag', async () => {
    const id = await addTransaction(regime)

    const options = {
      method: 'PATCH',
      url: `/v1/${regime.slug}/transactions/${id}/approve`,
      headers: { authorization: authToken }
    }
    const response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    const transaction = await regime.schema.Transaction.find(regime.id, id)
    expect(transaction.approved_for_billing).to.be.true()
  })
})

describe('Transactions controller: PATCH /v1/wrls/transactions/id/unapprove', () => {
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

  it('clears approved for billing flag', async () => {
    const id = await addTransaction(regime)

    // set the approved flag directly with the helper
    await updateTransaction(id, { approved_for_billing: true })

    const transaction = await regime.schema.Transaction.find(regime.id, id)
    expect(transaction.approved_for_billing).to.be.true()

    const options = {
      method: 'PATCH',
      url: `/v1/${regime.slug}/transactions/${id}/unapprove`,
      headers: { authorization: authToken }
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    await transaction.reload() // = await Transaction.find(regime.id, id)
    expect(transaction.approved_for_billing).to.be.false()
  })
})

describe('Transactions controller: DELETE /v1/wrls/transactions', () => {
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

  it('removes specified transaction', async () => {
    const id = await addTransaction(regime)

    expect(id).to.not.be.null()
    const opts = {
      method: 'DELETE',
      url: `/v1/wrls/transactions/${id}`,
      headers: { authorization: authToken }
    }

    const response = await server.inject(opts)
    expect(response.statusCode).to.equal(204)
  })
})
