const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')
const lab = exports.lab = Lab.script()
const createServer = require('../../app')
const Regime = require('../../app/models/regime')
const RuleService = require('../../app/lib/connectors/rules')
const { dummyCharge } = require('../helpers/charge_helper')
const { addTransaction, cleanTransactions } = require('../helpers/transaction_helper')

lab.experiment('Transaction Queue controller test', () => {
  let server
  let regime

  // Create server before the tests run
  lab.before(async () => {
    server = await createServer()
    regime = await Regime.find('wrls')
    await cleanTransactions()
  })

  lab.test('GET /v1/wrls/transaction_queue returns transactions', async () => {
    const options = {
      method: 'GET',
      url: '/v1/wrls/transaction_queue'
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.headers['content-type']).to.include('application/json')
    const payload = JSON.parse(response.payload)
    Code.expect(Object.keys(payload)).to.equal(['pagination', 'data'])
  })

  lab.test('POST /v1/wrls/transaction_queue adds transaction', async () => {
    const options = {
      method: 'POST',
      url: '/v1/wrls/transaction_queue',
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
        batchNumber: 'TEST-Transaction-Queue',
        region: 'A',
        areaCode: 'ARCA'
      }
    }

    const stub = Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge())
    const response = await server.inject(options)

    const stubCalled = stub.called
    stub.restore()
    Code.expect(stubCalled).to.be.true()
    Code.expect(response.statusCode).to.equal(201)
  })

  lab.test('POST /v1/wrls/transaction_queue with invalid data does not add transaction', async () => {
    const options = {
      method: 'POST',
      url: '/v1/wrls/transaction_queue',
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
    Code.expect(response.statusCode).to.equal(422)
  })

  lab.test('DELETE /v1/wrls/transaction_queue/id removes transaction', async () => {
    const id = await addTransaction(regime)

    Code.expect(id).to.not.be.null()
    const opts = {
      method: 'DELETE',
      url: '/v1/wrls/transaction_queue/' + id
    }

    const response = await server.inject(opts)
    Code.expect(response.statusCode).to.equal(204)
  })
})
