const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const Calculation = require('../../../../app/schema/pre_sroc/wrls/calculation')
const { dummyCalculation } = require('../../../helpers/charge_helper')

lab.experiment('PreSRoC Calculation (WRLS) test', () => {
  lab.test('it validates required parameters', () => {
    const params = dummyCalculation()

    const result = Calculation.validate(params)
    Code.expect(result.error).to.not.exist()
  })

  lab.test('it fails validation when messages is not empty', () => {
    const params = dummyCalculation()
    params.messages = ['Test error']

    const result = Calculation.validate(params)
    Code.expect(result.error).to.exist()
  })

  lab.test('chargeElementAgreement is set to s127Agreement when present', () => {
    const params = dummyCalculation()
    params.WRLSChargingResponse.abatementAdjustment = 'S126 x 1.0'
    params.WRLSChargingResponse.s127Agreement = 'S127 x 0.4'

    const calc = new Calculation(params, false)
    Code.expect(calc.chargeElementAgreement).to.equal('S127 x 0.4')
  })

  lab.test('chargeElementAgreement is set to null when no s127Agreement and abatementAdjustment is 1.0', () => {
    const params = dummyCalculation()
    params.WRLSChargingResponse.abatementAdjustment = 'S126 x 1.0'
    params.WRLSChargingResponse.s127Agreement = null

    const calc = new Calculation(params, false)
    Code.expect(calc.chargeElementAgreement).to.be.null()
  })

  lab.test('chargeElementAgreement is set to abatementAdjustment when no s127Agreement and abatementAdjustment is not 1.0', () => {
    const params = dummyCalculation()
    params.WRLSChargingResponse.abatementAdjustment = 'S126 x 0.45'
    params.WRLSChargingResponse.s127Agreement = null

    const calc = new Calculation(params, false)
    Code.expect(calc.chargeElementAgreement).to.equal('S126 x 0.45')
  })
})
