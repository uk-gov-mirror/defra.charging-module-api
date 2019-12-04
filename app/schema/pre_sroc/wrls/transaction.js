const Joi = require('@hapi/joi')
const { pool } = require('../../../lib/connectors/db')
const config = require('../../../../config/config')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')
const Charge = require('./charge')

// Pre-SRoC Data Maps ===================

const TRANSACTION_QUERY = 'SELECT id,' +
  'region AS "region",' +
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
  'regime_value_10 AS "section126Agreement",' +
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
  'line_attr_4::float AS "suc",' +
  'charge_value AS "chargeValue",' +
  'charge_credit AS "credit",' +
  'to_char(transaction_date, \'DD-MON-YYYY\') AS "transactionDate",' +
  'line_area_code AS "areaCode",' +
  'line_description AS "lineDescription",' +
  'transaction_type AS "transactionType",' +
  'transaction_reference AS "transactionReference",' +
  'bill_run AS "billRunId",' +
  'status AS "transactionStatus",' +
  'approved_for_billing AS "approvedForBilling",' +
  'charge_calculation AS "calculation" ' +
  'FROM transactions'

class Transaction {
  constructor (data) {
    // assume database record or data in DB naming scheme (pre-saving)
    Object.assign(this, data)
  }

  // constructor (data) {
  //   const { error, value } = this.constructor.validate(data)
  //   if (error) {
  //     throw error
  //   }

  //   Object.assign(this, this.constructor.translate(value))

  //   this.charge_financial_year = utils.financialYearFromDate(this.charge_period_start)
  //   this.pre_sroc = true
  //   this.setProrataDays()
  // }

  static instanceFromRequest (params) {
    const { error, value } = this.validate(params)
    if (error) {
      throw error
    }

    const t = new Transaction(this.translate(value))

    t.charge_financial_year = utils.financialYearFromDate(t.charge_period_start)
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
    this.line_attr_10 = calc.calculation.chargeElementAgreement
    this.regime_value_13 = calc.calculation.eiucSourceFactor
    this.line_attr_14 = calc.calculation.eiucFactor
    this.line_attr_4 = calc.calculation.sucFactor

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
    this.line_attr_3 = `${this.regime_value_4}/${this.regime_value_5}`
  }

  static validate (data) {
    const result = Joi.validate(data, this.schema, { abortEarly: false })
    // const result = this.schema.validate(data, { abortEarly: false })
    if (result.error) {
      return result
    }

    return utils.validateFinancialYear(result.value)
  }

  static translate (data) {
    // translate filter values using main attribute map for pre-sroc WRLS naming
    return utils.translateData(data, AttributeMap)
  }

  static async search (params) {
    const { page, perPage, sort, sortDir, ...q } = params

    const pagination = {
      page: page || config.pagination.page,
      perPage: perPage || config.pagination.perPage
    }

    const offset = (pagination.page - 1) * pagination.perPage
    const limit = pagination.perPage

    // build where clause
    // regime name, database name
    // const transactions = require(`../schema/${regime.slug}_transaction`)
    // const schema = Schema[regime.slug]
    const select = TRANSACTION_QUERY

    // where clause uses DB names not mapped names
    const where = []
    const values = []
    let attrCount = 1

    Object.keys(q).forEach(k => {
      const col = AttributeMap[k]
      if (col) {
        let val = q[k]
        if (val && val.indexOf('*') !== -1) {
          val = val.replace(/\*/g, '%')
          where.push(`${col} like $${attrCount++}`)
        } else {
          where.push(`${col} = $${attrCount++}`)
        }
        values.push(val)
      }
    })

    const whr = where.join(' AND ')

    // order clause uses mapped names
    const order = this.orderQuery(sort, sortDir)

    const promises = [
      pool.query('SELECT count(*) FROM transactions WHERE ' + whr, values),
      pool.query(select + ' WHERE ' +
        whr + ' ORDER BY ' + order.join(',') + ` OFFSET $${attrCount++} LIMIT $${attrCount++}`,
      [...values, offset, limit])
    ]

    const results = await Promise.all(promises)
    const count = parseInt(results[0].rows[0].count)
    const pageTotal = Math.ceil(count / limit)
    const rows = results[1].rows

    pagination.pageCount = pageTotal
    pagination.recordCount = count

    return {
      pagination,
      data: {
        transactions: rows
      }
    }
  }

  static orderQuery (sort, sortDir) {
    // default sort order for WRLS is customer_reference and licence_number (line_attr_1) asc
    const order = []
    const defaultCols = ['customer_reference', 'line_attr_1']
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

  static async find (regimeId, id) {
    const query = TRANSACTION_QUERY + ' WHERE id=$1::uuid AND regime_id=$2::uuid'
    const result = await pool.query(query, [id, regimeId])
    if (result.rowCount !== 1) {
      return null
    }
    return result.rows[0]
  }

  static get schema () {
    return {
      region: Joi.string().uppercase().length(1).required(),
      customerReference: Joi.string().uppercase().required(),
      batchNumber: Joi.string().allow('', null),
      invoiceDate: Joi.date().required(),
      licenceNumber: Joi.string().required(),
      chargePeriod: Joi.string().required(),
      chargeElementId: Joi.string().allow('', null),
      transactionDate: Joi.date().required(),
      areaCode: Joi.string().required(),
      lineDescription: Joi.string().required(),
      ...Charge.schema
    }
  }
}

module.exports = Transaction
