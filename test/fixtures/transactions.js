'use strict'

const { dummyCharge } = require('../helpers/charge_helper')
const Calculation = require('../../app/schema/pre_sroc/wrls/calculation')

function StandardTransaction (regimeId, isCredit = false, alternateData = {}) {
  const fixture = {
    regime_id: regimeId,
    charge_period_start: '01-APR-2019',
    charge_period_end: '31-MAR-2020',
    charge_credit: isCredit,
    regime_value_4: 230,
    regime_value_5: 240,
    line_attr_5: '3.5865',
    regime_value_6: 'Supported',
    regime_value_7: 'Summer',
    regime_value_8: 'Low',
    regime_value_16: false,
    regime_value_17: true,
    regime_value_13: 'Tidal',
    regime_value_14: false,
    regime_value_15: 'Anglian',
    regime_value_12: false,
    regime_value_9: false,
    customer_reference: 'TH12345678',
    line_description: 'Drains within Littleport & Downham IDB',
    line_attr_1: '123/456/26/*S/0453/R01',
    line_attr_2: '01-APR-2018 - 31-MAR-2019',
    regime_value_3: '',
    regime_value_1: 'TEST-Transaction',
    region: 'A',
    line_area_code: 'ARCA',
    pre_sroc: true,
    ...chargeData(isCredit)
  }

  return Object.assign(fixture, alternateData)
}

function chargeData (isCredit) {
  const calc = new Calculation(dummyCharge(), isCredit)

  return {
    line_attr_6: calc.calculation.sourceFactor,
    line_attr_7: calc.calculation.seasonFactor,
    line_attr_8: calc.calculation.lossFactor,
    line_attr_9: calc.calculation.s130Agreement,
    line_attr_10: calc.chargeElementAgreement,
    line_attr_13: calc.calculation.eiucSourceFactor,
    line_attr_14: calc.calculation.eiucFactor,
    line_attr_4: calc.sucFactor,
    charge_value: calc.chargeValue,
    currency_line_amount: calc.chargeValue,
    unit_of_measure_price: calc.chargeValue,
    charge_calculation: JSON.stringify(calc)
  }
}

module.exports = {
  StandardTransaction
}
