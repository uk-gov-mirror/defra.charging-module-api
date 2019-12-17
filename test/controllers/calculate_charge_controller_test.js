const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')
const lab = exports.lab = Lab.script()
const createServer = require('../../app')
const RuleService = require('../../app/lib/connectors/rules')
const Regime = require('../../app/models/regime')
const { dummyCharge } = require('../helpers/charge_helper')

lab.experiment('Calculate Charge controller test', () => {
  let server
  let regime
  let ruleStub

  // Create server before the experiment
  lab.before(async () => {
    server = await createServer()
    regime = await Regime.find('wrls')
    ruleStub = Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge())
  })

  lab.after(() => {
    ruleStub.restore()
  })

  lab.test('POST /v1/wrls/calculate_charge returns charge', async () => {
    const options = {
      method: 'POST',
      url: `/v1/${regime.slug}/calculate_charge`,
      payload: {
        periodStart: '01-APR-2019',
        periodEnd: '31-MAR-2020',
        credit: true,
        billableDays: 214,
        authorisedDays: 345,
        volume: '223.55',
        source: 'Supported',
        season: 'Summer',
        loss: 'High',
        twoPartTariff: false,
        compensationCharge: false,
        eiucSource: 'Tidal',
        waterUndertaker: false,
        regionalChargingArea: 'Anglian',
        section127Agreement: false,
        section130Agreement: false
      }
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(ruleStub.called).to.be.true()
    Code.expect(JSON.parse(response.payload).calculation.chargeValue).to.equal(-1234500)
  })

  lab.test('POST /v1/wrls/calculate_charge without payload returns 400 error', async () => {
    const options = {
      method: 'POST',
      url: `/v1/${regime.slug}/calculate_charge`
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(400)
  })

  lab.test('POST /v1/wrls/calculate_charge with invalid payload schema returns 422 error', async () => {
    const options = {
      method: 'POST',
      url: `/v1/${regime.slug}/calculate_charge`,
      payload: {
        periodStart: '01-APR-2019',
        periodEnd: '31-MAR-2020',
        region: 'A',
        banana: 'custard'
      }
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(422)
  })
})
