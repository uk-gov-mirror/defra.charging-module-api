const Joi = require('@hapi/joi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const { expect } = Code
const Regime = require('../../../../app/models/regime')
const Transaction = require('../../../../app/schema/pre_sroc/wrls/transaction')
const { addTransaction } = require('../../../helpers/transaction_helper')

describe('PreSRoC Transaction (WRLS)', () => {
  it('validates required parameters', async () => {
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
      twoPartTariff: false,
      compensationCharge: false,
      eiucSource: 'Tidal',
      waterUndertaker: false,
      regionalChargingArea: 'Midlands',
      section127Agreement: false,
      section130Agreement: false,
      customerReference: 'THVV33009',
      lineDescription: 'Drains within Littleport & Downham IDB',
      licenceNumber: '123/456/26/*S/0453/R01',
      chargePeriod: '01-APR-2018 - 31-MAR-2019',
      chargeElementId: '',
      batchNumber: 'TONY6',
      region: 'B',
      areaCode: 'ARCA'
    }

    const result = Transaction.validate(params)
    expect(result.error).to.not.exist()
  })

  it('zero pads the prorataDays elements to 3 digits', async () => {
    const regime = await Regime.find('wrls')
    const id = await addTransaction(regime, { billableDays: 10, authorisedDays: 99 })
    const transaction = await Transaction.find(regime.id, id)
    // line_attr_3 is prorataDays
    expect(transaction.line_attr_3).to.equal('010/099')
  })

  it('returns the correct attributes when queried', async () => {
    const regime = await Regime.find('wrls')
    const id = await addTransaction(regime)
    expect(id).to.not.be.null()

    const transaction = await Transaction.findRaw(regime.id, id)
    expect(transaction).to.not.be.null()

    const dateRx = /^\d\d?-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-20\d\d$/

    const outputSchema = {
      id: Joi.string().guid().required(),
      region: Joi.string().length(1).required(),
      periodStart: Joi.string().regex(dateRx).required(),
      periodEnd: Joi.string().regex(dateRx).required(),
      customerReference: Joi.string().required(),
      batchNumber: Joi.string().allow('', null),
      invoiceDate: Joi.string().allow('', null),
      licenceNumber: Joi.string().required(),
      chargePeriod: Joi.string().required(),
      chargeElementId: Joi.string().allow('', null),
      billableDays: Joi.number().integer().min(0).max(366).required(),
      authorisedDays: Joi.number().integer().min(0).max(366).required(),
      prorataDays: Joi.string().required(),
      volume: Joi.number().positive().required(),
      source: Joi.string().required(),
      sourceFactor: Joi.number().positive().required(),
      season: Joi.string().required(),
      seasonFactor: Joi.number().positive().required(),
      loss: Joi.string().required(),
      lossFactor: Joi.number().positive().required(),
      section130Agreement: Joi.boolean(),
      licenceHolderChargeAgreement: Joi.string().allow('', null),
      section126Factor: Joi.number().required(),
      section127Agreement: Joi.boolean(),
      chargeElementAgreement: Joi.string().allow('', null),
      twoPartTariff: Joi.boolean().required(),
      compensationCharge: Joi.boolean().required(),
      eiucSource: Joi.string(),
      eiucSourceFactor: Joi.number().positive().required(),
      waterUndertaker: Joi.boolean().required(),
      regionalChargingArea: Joi.string().required(),
      eiuc: Joi.number().positive(),
      suc: Joi.number().positive(),
      chargeValue: Joi.number().integer().required(),
      credit: Joi.boolean().required(),
      transactionDate: Joi.string().regex(dateRx).allow('', null),
      areaCode: Joi.string().required(),
      lineDescription: Joi.string().required(),
      transactionType: Joi.string().regex(/^[CI]$/).allow('', null),
      transactionReference: Joi.string().allow('', null),
      billRunNumber: Joi.number().integer().positive().allow(null),
      transactionStatus: Joi.string().required(),
      approvedForBilling: Joi.boolean().required(),
      newLicence: Joi.boolean().required(),
      minimumChargeAdjustment: Joi.boolean().required(),
      deminimis: Joi.boolean().required(),
      transactionFileReference: Joi.string().allow(null),
      calculation: Joi.object()
    }
    const result = Joi.validate(transaction, outputSchema)
    expect(result.error).to.not.exist()
  })

  it('does not overwrite eiucSource with charge calculation attributes', async () => {
    const regime = await Regime.find('wrls')
    const id = await addTransaction(regime)
    expect(id).to.not.be.null()

    const t = await Transaction.find(regime.id, id)
    expect(t).to.not.be.null()
    expect(t.regime_value_13).to.equal('Tidal')
  })
})
