const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const Charge = require('../../../../app/schema/pre_sroc/wrls/charge')

lab.experiment('PreSRoC Charge (WRLS) test', () => {
  lab.test('it validates required parameters', async () => {
    const params = {
      periodStart: '01-APR-2019',
      periodEnd: '31-MAR-2020',
      credit: false,
      billableDays: 310,
      authorisedDays: 365,
      volume: '3.5865',
      source: 'Supported',
      season: 'Summer',
      loss: 'Low',
      section130Agreement: false,
      section126Factor: 0.3,
      section127Agreement: false,
      twoPartTariff: false,
      compensationCharge: false,
      eiucSource: 'Tidal',
      waterUndertaker: false,
      regionalChargingArea: 'Midlands'
    }

    const result = Charge.validate(params)
    Code.expect(result.error).to.not.exist()
  })

  lab.test('it validates that eiucSource is mandatory for compensation charge', async () => {
    const params = {
      periodStart: '01-APR-2019',
      periodEnd: '31-MAR-2020',
      credit: false,
      billableDays: 310,
      authorisedDays: 365,
      volume: '3.5865',
      source: 'Supported',
      season: 'Summer',
      loss: 'Low',
      section130Agreement: false,
      section126Factor: 0.3,
      section127Agreement: false,
      twoPartTariff: false,
      compensationCharge: true,
      waterUndertaker: false,
      regionalChargingArea: 'Midlands'
    }

    const result = Charge.validate(params)
    Code.expect(result.error).to.exist()

    params.eiucSource = 'Tidal'
    const result2 = Charge.validate(params)
    Code.expect(result2.error).to.not.exist()
  })

  lab.test('it validates that eiucSource is not mandatory when not a compensation charge', async () => {
    const params = {
      periodStart: '01-APR-2019',
      periodEnd: '31-MAR-2020',
      credit: false,
      billableDays: 310,
      authorisedDays: 365,
      volume: '3.5865',
      source: 'Supported',
      season: 'Summer',
      loss: 'Low',
      section130Agreement: false,
      section126Factor: 0.3,
      section127Agreement: false,
      twoPartTariff: false,
      compensationCharge: true,
      waterUndertaker: false,
      regionalChargingArea: 'Midlands'
    }

    const result = Charge.validate(params)
    Code.expect(result.error).to.exist()

    params.compensationCharge = false
    const result2 = Charge.validate(params)
    Code.expect(result2.error).to.not.exist()
  })
})
