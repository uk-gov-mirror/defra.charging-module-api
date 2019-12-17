const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const Helper = require('../helpers/transaction_helper')
const Transaction = require('../../app/models/transaction')

lab.experiment('Transactions controller test', () => {
  let server
  let regime

  // Create server before each test
  lab.before(async () => {
    Helper.cleanTransactions()
    server = await createServer()
    regime = await Regime.find('wrls')
  })

  lab.test('GET /v1/wrls/transactions/id returns transaction', async () => {
    const id = await Helper.addTransaction(regime)

    const options = {
      method: 'GET',
      url: '/v1/wrls/transactions/' + id
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.headers['content-type']).to.include('application/json')
    const payload = JSON.parse(response.payload)
    Code.expect(payload.transaction.id).to.equal(id)
  })

  lab.test('GET /v1/wrls/transactions/id with invalid id returns 404', async () => {
    const options = {
      method: 'GET',
      url: '/v1/wrls/transactions/deadbeef-0914-44f7-80ad-666ef0df67e0'
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(404)
    Code.expect(response.headers['content-type']).to.include('application/json')
    const payload = JSON.parse(response.payload)
    Code.expect(payload).to.include(['statusCode', 'error', 'message'])
  })

  lab.test('PATCH /v1/wrls/transactions/id/approve sets approved for billing flag', async () => {
    const id = await Helper.addTransaction(regime)

    const options = {
      method: 'PATCH',
      url: `/v1/${regime.slug}/transactions/${id}/approve`
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(204)

    const transaction = await Transaction.find(regime.id, id)
    Code.expect(transaction.approved_for_billing).to.be.true()
  })

  lab.test('PATCH /v1/wrls/transactions/id/unapprove clears approved for billing flag', async () => {
    const id = await Helper.addTransaction(regime)

    // set the approved flag directly with the helper
    await Helper.updateTransaction(id, { approved_for_billing: true })

    const transaction = await Transaction.find(regime.id, id)
    Code.expect(transaction.approved_for_billing).to.be.true()

    const options = {
      method: 'PATCH',
      url: `/v1/${regime.slug}/transactions/${id}/unapprove`
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(204)

    await transaction.reload() // = await Transaction.find(regime.id, id)
    Code.expect(transaction.approved_for_billing).to.be.false()
  })

  lab.test('DELETE /v1/wrls/transaction_queue/id removes transaction', async () => {
    const id = await Helper.addTransaction(regime)

    const opts = {
      method: 'DELETE',
      url: '/v1/wrls/transaction_queue/' + id
    }

    const response = await server.inject(opts)
    Code.expect(response.statusCode).to.equal(204)
  })
})
