'use strict'

function InvalidTransactionRequest (alternateData = {}) {
  return {
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
    credit: true,
    ...alternateData
  }
}

function StandardTransactionRequest (alternateData = {}) {
  return {
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
    batchNumber: 'TEST-Transaction',
    region: 'A',
    areaCode: 'ARCA',
    ...alternateData
  }
}

module.exports = {
  InvalidTransactionRequest,
  StandardTransactionRequest
}
