const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const { addTransaction, cleanTransactions } = require('../helpers/transaction_helper')

lab.experiment('Billruns controller test', () => {
  let server
  let regime

  // Create server before each test
  lab.before(async () => {
    server = await createServer()
    regime = await Regime.find('wrls')
    await cleanTransactions()
  })

  lab.test('POST /v1/wrls/billruns returns billrun summary for draft', async () => {
    await addTransaction(regime)

    const options = {
      method: 'POST',
      url: '/v1/wrls/billruns',
      payload: {
        region: 'A',
        draft: true
      }
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
  })

  lab.test('POST /v1/wrls/billruns returns billrun summary for non-draft', async () => {
    await addTransaction(regime)

    const options = {
      method: 'POST',
      url: '/v1/wrls/billruns',
      payload: {
        region: 'A',
        draft: false
      }
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(201)
    Code.expect(response.headers.location).to.exist()
  })

  lab.test('POST /v1/wrls/billruns without payload returns 400 error', async () => {
    const options = {
      method: 'POST',
      url: '/v1/wrls/billruns'
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(400)
  })

  lab.test('POST /v1/wrls/billruns with invalid payload schema returns 422 error', async () => {
    const options = {
      method: 'POST',
      url: '/v1/wrls/billruns',
      payload: {
        region: 'A',
        banana: 'ripe'
      }
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(422)
  })

  lab.test('POST /v1/wrls/billruns when filter matches nothing returns 422 error', async () => {
    const options = {
      method: 'POST',
      url: '/v1/wrls/billruns',
      payload: {
        region: 'A',
        draft: true,
        filter: {
          batchNumber: '122334567qazxsw'
        }
      }
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(422)
  })
})
