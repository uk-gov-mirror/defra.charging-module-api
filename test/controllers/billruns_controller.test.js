const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code
const createServer = require('../../app')
// const Regime = require('../../app/models/regime')
const { cleanTransactions } = require('../helpers/transaction_helper')
const { makeAdminAuthHeader } = require('../helpers/authorisation_helper')
// const BillRun = require('../../app/models/bill_run')
// const Transaction = require('../../app/models/transaction')

describe('Billruns controller: POST /v1/wrls/billruns', () => {
  let server
  // let regime

  // Create server before each test
  before(async () => {
    server = await createServer()
    // regime = await Regime.find('wrls')
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

  // it('does not include an id and filename in payload when draft', async () => {
  //   await addTransaction(regime)

  //   const options = {
  //     method: 'POST',
  //     url: '/v1/wrls/billruns',
  //     payload: {
  //       region: 'A',
  //       draft: true
  //     }
  //   }
  //   const response = await server.inject(options)
  //   const payload = JSON.parse(response.payload)
  //   expect(payload.id).to.not.exist()
  //   expect(payload.filename).to.not.exist()
  // })

  // it('returns billrun summary for non-draft', async () => {
  //   const tId = await addTransaction(regime)
  //   await updateTransaction(tId, { approved_for_billing: true })

  //   const options = {
  //     method: 'POST',
  //     url: '/v1/wrls/billruns',
  //     payload: {
  //       region: 'A',
  //       draft: false
  //     }
  //   }
  //   const response = await server.inject(options)
  //   expect(response.statusCode).to.equal(201)
  //   expect(response.headers.location).to.exist()
  // })

  // it('includes an id and filename in payload when non-draft', async () => {
  //   const tId = await addTransaction(regime)
  //   await updateTransaction(tId, { approved_for_billing: true })

  //   const options = {
  //     method: 'POST',
  //     url: '/v1/wrls/billruns',
  //     payload: {
  //       region: 'A',
  //       draft: false
  //     }
  //   }
  //   const response = await server.inject(options)
  //   const payload = JSON.parse(response.payload)
  //   expect(payload.id).to.exist()
  //   expect(payload.filename).to.exist()
  // })

  // it('creates a bill run record when not draft', async () => {
  //   const tId = await addTransaction(regime)
  //   await updateTransaction(tId, { approved_for_billing: true })

  //   const options = {
  //     method: 'POST',
  //     url: '/v1/wrls/billruns',
  //     payload: {
  //       region: 'A',
  //       draft: false
  //     }
  //   }
  //   const response = await server.inject(options)
  //   const payload = JSON.parse(response.payload)

  //   const result = await BillRun.find(null, regime.id, payload.id)
  //   expect(result).to.not.be.null()
  // })

  // it('creates an association between the transaction and bill run records when not draft', async () => {
  //   const tId = await addTransaction(regime)
  //   await updateTransaction(tId, { approved_for_billing: true })

  //   const options = {
  //     method: 'POST',
  //     url: '/v1/wrls/billruns',
  //     payload: {
  //       region: 'A',
  //       draft: false
  //     }
  //   }
  //   const response = await server.inject(options)
  //   const payload = JSON.parse(response.payload)
  //   const transaction = await Transaction.find(regime.id, tId)
  //   expect(transaction.bill_run_id).to.equal(payload.id)
  // })

  // it('returns error 400 when no payload supplied', async () => {
  //   const options = {
  //     method: 'POST',
  //     url: '/v1/wrls/billruns'
  //   }
  //   const response = await server.inject(options)
  //   expect(response.statusCode).to.equal(400)
  // })

  // it('returns 422 error when payload schema invalid', async () => {
  //   const options = {
  //     method: 'POST',
  //     url: '/v1/wrls/billruns',
  //     payload: {
  //       region: 'A',
  //       banana: 'ripe'
  //     }
  //   }
  //   const response = await server.inject(options)
  //   expect(response.statusCode).to.equal(422)
  // })

  // it('returns 422 error when filter matches nothing', async () => {
  //   const options = {
  //     method: 'POST',
  //     url: '/v1/wrls/billruns',
  //     payload: {
  //       region: 'A',
  //       draft: true,
  //       filter: {
  //         batchNumber: '122334567qazxsw'
  //       }
  //     }
  //   }

  //   const response = await server.inject(options)
  //   expect(response.statusCode).to.equal(422)
  // })
})
