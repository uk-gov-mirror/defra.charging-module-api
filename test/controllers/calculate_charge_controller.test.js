const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')
const { describe, it, before, after } = exports.lab = Lab.script()
const { expect } = Code
const createServer = require('../../app')
const RuleService = require('../../app/lib/connectors/rules')
const Regime = require('../../app/models/regime')
const { dummyCharge } = require('../helpers/charge_helper')
const { makeAdminAuthHeader } = require('../helpers/authorisation_helper')

describe('Calculate Charge controller: POST /v1/wrls/calculate-charge', () => {
  let server
  let regime
  let ruleStub
  let authToken

  // Create server before the experiment
  before(async () => {
    server = await createServer()
    regime = await Regime.find('wrls')
    ruleStub = Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge())
    authToken = makeAdminAuthHeader()
  })

  after(() => {
    ruleStub.restore()
  })

  it('returns a charge', async () => {
    const options = {
      method: 'POST',
      url: `/v1/${regime.slug}/calculate-charge`,
      headers: { authorization: authToken },
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
    expect(response.statusCode).to.equal(200)
    expect(ruleStub.called).to.be.true()
    expect(JSON.parse(response.payload).calculation.chargeValue).to.equal(-1234500)
  })

  it('returns 400 error when no payload supplied', async () => {
    const options = {
      method: 'POST',
      url: `/v1/${regime.slug}/calculate-charge`,
      headers: { authorization: authToken }
    }
    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  it('returns 422 error when payload schema is invalid', async () => {
    const options = {
      method: 'POST',
      url: `/v1/${regime.slug}/calculate-charge`,
      headers: { authorization: authToken },
      payload: {
        periodStart: '01-APR-2019',
        periodEnd: '31-MAR-2020',
        region: 'A',
        banana: 'custard'
      }
    }
    const response = await server.inject(options)
    expect(response.statusCode).to.equal(422)
  })
})
