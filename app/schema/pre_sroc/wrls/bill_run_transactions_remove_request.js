const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')
const Validations = require('./validations')

class WrlsBillRunTransactionsRemoveRequest {
  constructor (regime, billRun, params) {
    this.regime = regime
    this.billRun = billRun

    if (params) {
      const { error, value } = this.constructor.validate(params)
      if (error) {
        throw Boom.badData(error)
      }

      Object.assign(this, value)
    }
  }

  get collectionName () {
    return 'transactions'
  }

  get searchParams () {
    const params = {}
    this.constructor.inputCols.forEach(k => {
      const mappedName = AttributeMap[k]
      if (k && this[k]) {
        params[mappedName] = this[k]
      }
    })
    params.regime_id = this.regime.id
    params.bill_run_id = this.billRun.id
    params.pre_sroc = true
    return params
  }

  get whereClause () {
    const where = []
    const values = []
    const params = this.searchParams
    let attrCount = 1

    Object.keys(params).forEach(col => {
      if (col) {
        const val = params[col]

        if (val && val.indexOf && val.indexOf('%') !== -1) {
          where.push(`${col} like $${attrCount++}`)
        } else {
          where.push(`${col}=$${attrCount++}`)
        }
        values.push(val)
      }
    })

    return {
      where,
      values
    }
  }

  async query (db) {
    const { where, values } = this.whereClause
    const whr = where.join(' AND ')

    const q = `
      SELECT t.id,
      t.region,
      to_char(charge_period_start, 'DD-MON-YYYY') AS "periodStart",
      to_char(charge_period_end, 'DD-MON-YYYY') AS "periodEnd",
      customer_reference AS "customerReference",
      regime_value_1 AS "batchNumber",
      to_char(header_attr_1::date, 'DD-MON-YYYY') AS "invoiceDate",
      line_attr_1 AS "licenceNumber",
      line_attr_2 AS "chargePeriod",
      regime_value_3 AS "chargeElementId",
      regime_value_4::int AS "billableDays",
      regime_value_5::int AS "authorisedDays",
      line_attr_3 AS "prorataDays",
      line_attr_5::float AS "volume",
      regime_value_6 AS "source",
      line_attr_6::float AS "sourceFactor",
      regime_value_7 AS "season",
      line_attr_7::float AS "seasonFactor",
      regime_value_8 AS "loss",
      line_attr_8::float AS "lossFactor",
      regime_value_9::bool AS "section130Agreement",
      line_attr_9 AS "licenceHolderChargeAgreement",
      regime_value_11::float AS "section126Factor",
      regime_value_12::bool AS "section127Agreement",
      line_attr_10 AS "chargeElementAgreement",
      regime_value_16::bool AS "twoPartTariff",
      regime_value_17::bool AS "compensationCharge",
      regime_value_13 AS "eiucSource",
      line_attr_13::float AS "eiucSourceFactor",
      regime_value_14::bool AS "waterUndertaker",
      regime_value_15 AS "regionalChargingArea",
      line_attr_14::float AS "eiuc",
      line_attr_4::int AS "suc",
      charge_value AS "chargeValue",
      charge_credit AS "credit",
      to_char(transaction_date, 'DD-MON-YYYY') AS "transactionDate",
      line_area_code AS "areaCode",
      line_description AS "lineDescription",
      transaction_type AS "transactionType",
      transaction_reference AS "transactionReference",
      t.bill_run_number AS "billRunId",
      t.status AS "transactionStatus",
      t.approved_for_billing AS "approvedForBilling",
      CASE
      WHEN t.status <> 'billed' THEN
        NULL
      ELSE
        b.transaction_filename
      END AS "transactionFileReference"
      FROM transactions t
      JOIN bill_runs b ON t.bill_run_id = b.id
      WHERE ${whr}
      ORDER BY ${this.orderQuery().join(',')}
      OFFSET ${this.offset} LIMIT ${this.limit}
    `
    return db.query(q, values)
  }

  static validate (data) {
    return Joi.validate(data, this.schema, { abortEarly: false })
  }

  static translate (data) {
    // translate filter values using main attribute map for pre-sroc WRLS naming
    return utils.translateData(data, AttributeMap)
  }

  // static async instanceFromRequest (regimeId, params) {
  //   const { error, value } = this.validate(params)
  //   if (error) {
  //     throw Boom.badData(error)
  //   }

  //   return new this(regimeId, value)
  // }

  static get inputCols () {
    return [
      'customerReference',
      'licenceNumber',
      'financialYear'
    ]
  }

  static get schema () {
    return {
      customerReference: Validations.customerReferenceValidator,
      licenceNumber: Validations.stringValidator,
      financialYear: Validations.financialYearValidator
    }
  }
}

module.exports = WrlsBillRunTransactionsRemoveRequest
