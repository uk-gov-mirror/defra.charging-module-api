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

  get licenceNumber () {
    return this.line_attr_1
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

  generateMinimumChargeAttrs (chargeAmount) {
    // use current transaction as base for WRLS minimum charge adjustment and return attributes
    return {
      regime_id: this.regime_id,
      bill_run_id: this.bill_run_id,
      new_licence: true, // want it grouped alongside new licences
      minimum_charge_adjustment: true,
      pre_sroc: this.pre_sroc,
      region: this.region,
      customer_reference: this.customer_reference,
      line_attr_1: this.line_attr_1, // licence number
      line_area_code: this.line_area_code,
      status: this.status,
      approved_for_billing: this.approved_for_billing,
      bill_run_number: this.bill_run_number,
      charge_value: chargeAmount,
      currency_line_amount: chargeAmount,
      unit_of_measure_price: chargeAmount,
      charge_credit: (chargeAmount < 0),
      charge_financial_year: this.charge_financial_year,
      regime_value_1: this.regime_value_1, // batch number
      regime_value_17: this.regime_value_17, // compensation charge - affects grouping?
      line_description: 'Minimum Charge Calculation - raised under Schedule 23 of the Environment Act 1995'
    }
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
      order.push(`t.${sortCols[i]} ${sortDirection}`)
    }

    // add additional sub-sort on customer reference
    if (!sortCols.includes('customer_reference')) {
      order.push(`t.customer_reference ${sortDirection}`)
    }
    order.push(`t.created_at ${sortDirection}`)

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
      newLicence: Joi.boolean().default(false),
      ...Charge.schema
    }
  }

  static get rawQuery () {
    return `SELECT
      t.id,
      t.region,
      to_char(t.charge_period_start, 'DD-MON-YYYY') AS "periodStart",
      to_char(t.charge_period_end, 'DD-MON-YYYY') AS "periodEnd",
      t.customer_reference AS "customerReference",
      t.regime_value_1 AS "batchNumber",
      to_char(t.header_attr_1::date, 'DD-MON-YYYY') AS "invoiceDate",
      t.line_attr_1 AS "licenceNumber",
      t.line_attr_2 AS "chargePeriod",
      t.regime_value_3 AS "chargeElementId",
      t.regime_value_4::int AS "billableDays",
      t.regime_value_5::int AS "authorisedDays",
      t.line_attr_3 AS "prorataDays",
      t.line_attr_5::float AS "volume",
      t.regime_value_6 AS "source",
      t.line_attr_6::float AS "sourceFactor",
      t.regime_value_7 AS "season",
      t.line_attr_7::float AS "seasonFactor",
      t.regime_value_8 AS "loss",
      t.line_attr_8::float AS "lossFactor",
      t.regime_value_9::bool AS "section130Agreement",
      t.line_attr_9 AS "licenceHolderChargeAgreement",
      t.regime_value_11::float AS "section126Factor",
      t.regime_value_12::bool AS "section127Agreement",
      t.line_attr_10 AS "chargeElementAgreement",
      t.regime_value_16::bool AS "twoPartTariff",
      t.regime_value_17::bool AS "compensationCharge",
      t.regime_value_13 AS "eiucSource",
      t.line_attr_13::float AS "eiucSourceFactor",
      t.regime_value_14::bool AS "waterUndertaker",
      t.regime_value_15 AS "regionalChargingArea",
      t.line_attr_14::float AS "eiuc",
      t.line_attr_4::int AS "suc",
      t.charge_value AS "chargeValue",
      t.charge_credit AS "credit",
      to_char(t.transaction_date, 'DD-MON-YYYY') AS "transactionDate",
      t.line_area_code AS "areaCode",
      t.line_description AS "lineDescription",
      t.transaction_type AS "transactionType",
      t.transaction_reference AS "transactionReference",
      t.bill_run_number AS "billRunNumber",
      t.status AS "transactionStatus",
      t.new_licence AS "newLicence",
      t.minimum_charge_adjustment AS "minimumChargeAdjustment",
      t.approved_for_billing AS "approvedForBilling",
      t.deminimis,
      CASE
        WHEN t.deminimis=TRUE
        THEN
          NULL
        ELSE
          br.transaction_filename
        END
      AS "transactionFileReference",
      t.charge_calculation AS "calculation"
      FROM transactions t LEFT OUTER JOIN bill_runs br ON (t.bill_run_id = br.id)`
  }
}

module.exports = WrlsTransaction
