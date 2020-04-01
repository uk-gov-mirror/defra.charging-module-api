const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const { financialYearFromDate, validateFinancialYear, translateData, zeroPad } = require('../../../lib/utils')
const { stringValidator, regionValidator, customerReferenceValidator, areaCodeValidator } = require('./validations')
const Charge = require('./charge')
const Transaction = require('../../../models/transaction')

class WrlsTransaction extends Transaction {
  get periodStart () {
    return this.charge_period_start
  }

  get periodEnd () {
    return this.charge_period_end
  }

  get customerReference () {
    return this.customer_reference
  }

  get batchNumber () {
    return this.regime_value_1
  }

  toJSON () {
    return {
      id: this.id,
      customerReference: this.customer_reference,
      batchNumber: this.batchNumber
    }
  }

  static instanceFromRequest (params) {
    const { error, value } = this.validate(params)
    if (error) {
      throw Boom.badData(error)
    }

    const t = this.build(this.translate(value))

    t.charge_financial_year = financialYearFromDate(t.charge_period_start)
    t.pre_sroc = true
    t.setProrataDays()
    return t
  }

  get charge () {
    // create a Charge from the transaction data
    return Charge.fromTransaction(this)
  }

  setCalculation (calc) {
    this.line_attr_6 = calc.calculation.sourceFactor
    this.line_attr_7 = calc.calculation.seasonFactor
    this.line_attr_8 = calc.calculation.lossFactor
    this.line_attr_9 = calc.calculation.s130Agreement
    this.line_attr_10 = calc.chargeElementAgreement
    this.line_attr_13 = calc.calculation.eiucSourceFactor
    this.line_attr_14 = calc.calculation.eiucFactor
    this.line_attr_4 = calc.sucFactor

    const chargeValue = calc.chargeValue
    this.charge_value = chargeValue
    this.currency_line_amount = chargeValue
    this.unit_of_measure_price = chargeValue
    this.charge_calculation = calc
  }

  setProrataDays () {
    // line_attr_3 -> prorataDays
    // regime_value_4 -> billableDays,
    // regime_value_5 -> authorisedDays
    this.line_attr_3 = `${zeroPad(this.regime_value_4, 3)}/${zeroPad(this.regime_value_5, 3)}`
  }

  static validate (data) {
    const result = Joi.validate(data, this.schema, { abortEarly: false })
    // const result = this.schema.validate(data, { abortEarly: false })
    if (result.error) {
      return result
    }

    return validateFinancialYear(result.value)
  }

  static translate (data) {
    // translate filter values using main attribute map for pre-sroc WRLS naming
    return translateData(data, AttributeMap)
  }

  static orderSearchQuery (sort, sortDir) {
    // default sort order for WRLS is customer_reference and licence_number (line_attr_1) transaction_reference asc
    const order = []
    const defaultCols = ['customer_reference', 'line_attr_1', 'transaction_reference']
    let sortCols = []
    let sortDirection = 'asc'

    if (sortDir && sortDir.toUpperCase() === 'DESC') {
      sortDirection = 'desc'
    }

    if (sort) {
      let cols
      if (sort instanceof Array) {
        cols = sort
      } else {
        cols = sort.split(',')
      }

      for (let i = 0; i < cols.length; i++) {
        const col = AttributeMap[cols[i]]
        if (col) {
          sortCols.push(col)
        }
      }
    }

    if (sortCols.length === 0) {
      sortCols = defaultCols
    }

    for (let i = 0; i < sortCols.length; i++) {
      order.push(`${sortCols[i]} ${sortDirection}`)
    }

    // add additional sub-sort on customer reference
    if (!sortCols.includes('customer_reference')) {
      order.push(`customer_reference ${sortDirection}`)
    }
    order.push(`created_at ${sortDirection}`)

    return order
  }

  static get schema () {
    return {
      region: regionValidator.required(),
      customerReference: customerReferenceValidator.required(),
      batchNumber: stringValidator.allow('', null),
      licenceNumber: stringValidator.max(150).required(),
      chargePeriod: stringValidator.required(),
      chargeElementId: stringValidator.allow('', null),
      areaCode: areaCodeValidator.required(),
      lineDescription: stringValidator.max(240).required(),
      ...Charge.schema
    }
  }

  static get rawQuery () {
    return 'SELECT id,' +
      'region,' +
      'to_char(charge_period_start, \'DD-MON-YYYY\') AS "periodStart",' +
      'to_char(charge_period_end, \'DD-MON-YYYY\') AS "periodEnd",' +
      'customer_reference AS "customerReference",' +
      'regime_value_1 AS "batchNumber",' +
      'to_char(header_attr_1::date, \'DD-MON-YYYY\') AS "invoiceDate",' +
      'line_attr_1 AS "licenceNumber",' +
      'line_attr_2 AS "chargePeriod",' +
      'regime_value_3 AS "chargeElementId",' +
      'regime_value_4::int AS "billableDays",' +
      'regime_value_5::int AS "authorisedDays",' +
      'line_attr_3 AS "prorataDays",' +
      'line_attr_5::float AS "volume",' +
      'regime_value_6 AS "source",' +
      'line_attr_6::float AS "sourceFactor",' +
      'regime_value_7 AS "season",' +
      'line_attr_7::float AS "seasonFactor",' +
      'regime_value_8 AS "loss",' +
      'line_attr_8::float AS "lossFactor",' +
      'regime_value_9::bool AS "section130Agreement",' +
      'line_attr_9 AS "licenceHolderChargeAgreement",' +
      'regime_value_11::float AS "section126Factor",' +
      'regime_value_12::bool AS "section127Agreement",' +
      'line_attr_10 AS "chargeElementAgreement",' +
      'regime_value_16::bool AS "twoPartTariff",' +
      'regime_value_17::bool AS "compensationCharge",' +
      'regime_value_13 AS "eiucSource",' +
      'line_attr_13::float AS "eiucSourceFactor",' +
      'regime_value_14::bool AS "waterUndertaker",' +
      'regime_value_15 AS "regionalChargingArea",' +
      'line_attr_14::float AS "eiuc",' +
      'line_attr_4::int AS "suc",' +
      'charge_value AS "chargeValue",' +
      'charge_credit AS "credit",' +
      'to_char(transaction_date, \'DD-MON-YYYY\') AS "transactionDate",' +
      'line_area_code AS "areaCode",' +
      'line_description AS "lineDescription",' +
      'transaction_type AS "transactionType",' +
      'transaction_reference AS "transactionReference",' +
      'bill_run_number AS "billRunId",' +
      'status AS "transactionStatus",' +
      'approved_for_billing AS "approvedForBilling",' +
      'charge_calculation AS "calculation" ' +
      'FROM transactions'
  }
}

module.exports = WrlsTransaction
