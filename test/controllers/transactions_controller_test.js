const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const createServer = require('../../app')
const queue = require('../../app/services/transaction_queue')
const Regime = require('../../app/services/query/regime')

lab.experiment('Transactions controller test', () => {
  let server
  let regime

  // Create server before each test
  lab.before(async () => {
    server = await createServer()
    regime = await Regime.findBySlug('wrls')
  })

  lab.test('GET /v1/wrls/transactions/id returns transaction', async () => {
    const id = await addTransaction(regime)

    const options = {
      method: 'GET',
      url: '/v1/wrls/transactions/' + id
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.headers['content-type']).to.include('application/json')
    const payload = JSON.parse(response.payload)
    Code.expect(payload.transaction).to.include({
      id: id,
      region: 'A',
      customer_reference: 'BB8895777A',
      batch_number: 'B1'
    })
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

  // lab.test('DELETE /v1/wrls/transaction_queue/id removes transaction', async () => {
  //   const id = await addTransaction(regime)

  //   const opts = {
  //     method: 'DELETE',
  //     url: '/v1/wrls/transaction_queue/' + id
  //   }

  //   const response = await server.inject(opts)
  //   Code.expect(response.statusCode).to.equal(204)
  // })
})

// TODO: move to test_utils.js or similar
async function addTransaction (regime) {
  return queue.addTransaction({
    regime_id: regime.id,
    customer_reference: 'BB8895777A',
    transaction_date: '20-Jul-2018',
    header_attr_1: '20-Jul-2018',
    line_description: 'Drains within Littleport & Downham IDB',
    line_attr_1: '6/33/26/*S/0453/R01',
    line_attr_2: '01-APR-2018 - 31-MAR-2019',
    line_attr_3: '214/214',
    regime_value_1: 'B1',
    line_attr_5: '3.5865 Ml',
    region: 'A',
    line_area_code: 'ARCA',
    charge_period_start: '01-APR-2018',
    charge_period_end: '31-MAR-2019',
    charge_credit: true
  })
}
