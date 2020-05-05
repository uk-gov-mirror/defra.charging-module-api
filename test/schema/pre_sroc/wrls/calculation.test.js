const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const { expect } = Code
const Calculation = require('../../../../app/schema/pre_sroc/wrls/calculation')
const { dummyCalculation } = require('../../../helpers/charge_helper')

describe('PreSRoC Calculation (WRLS)', () => {
  it('validates required parameters', () => {
    const params = dummyCalculation()

    const result = Calculation.validate(params)
    expect(result.error).to.not.exist()
  })

  it('fails validation when messages is not empty', () => {
    const params = dummyCalculation()
    params.messages = ['Test error']

    const result = Calculation.validate(params)
    expect(result.error).to.exist()
  })

  it('sets chargeElementAgreement to s127Agreement when present', () => {
    const params = dummyCalculation()
    params.WRLSChargingResponse.abatementAdjustment = 'S126 x 1.0'
    params.WRLSChargingResponse.s127Agreement = 'S127 x 0.4'

    const calc = new Calculation(params, false)
    expect(calc.chargeElementAgreement).to.equal('S127 x 0.4')
  })

  it('sets chargeElementAgreement to null when no s127Agreement and abatementAdjustment is 1.0', () => {
    const params = dummyCalculation()
    params.WRLSChargingResponse.abatementAdjustment = 'S126 x 1.0'
    params.WRLSChargingResponse.s127Agreement = null

    const calc = new Calculation(params, false)
    expect(calc.chargeElementAgreement).to.be.null()
  })

  it('sets chargeElementAgreement to abatementAdjustment when no s127Agreement and abatementAdjustment is not 1.0', () => {
    const params = dummyCalculation()
    params.WRLSChargingResponse.abatementAdjustment = 'S126 x 0.45'
    params.WRLSChargingResponse.s127Agreement = null

    const calc = new Calculation(params, false)
    expect(calc.chargeElementAgreement).to.equal('S126 x 0.45')
  })

  it('converts sucFactor into pence', () => {
    const params = dummyCalculation()
    // sucFactor is 27.51 in calculation
    const calc = new Calculation(params, false)
    expect(calc.sucFactor).to.equal(2751)
  })
})
