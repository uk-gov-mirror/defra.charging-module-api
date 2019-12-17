const Joi = require('@hapi/joi')
const utils = require('../../lib/utils')

// Pre-SRoC Data Maps ===================

const ATTRIBUTE_MAP = {
  region: 'region',
  periodStart: 'charge_period_start',
  periodEnd: 'charge_period_end',
  customerReference: 'customer_reference',
  batchNumber: 'regime_value_1',
  invoiceDate: 'header_attr_1',
  licenceNumber: 'line_attr_1',
  chargePeriod: 'line_attr_2',
  chargeElementId: 'regime_value_3',
  billableDays: 'regime_value_4',
  authorisedDays: 'regime_value_5',
  prorataDays: 'line_attr_3',
  volume: 'line_attr_5',
  source: 'regime_value_6',
  sourceFactor: 'line_attr_6',
  season: 'regime_value_7',
  seasonFactor: 'line_attr_7',
  loss: 'regime_value_8',
  lossFactor: 'line_attr_8',
  section130Agreement: 'regime_value_9',
  licenceHolderChargeAgreement: 'line_attr_9',
  // section130Factor: 'regime_value_18',
  section126Agreement: 'regime_value_10',
  chargeElementAgreement: 'line_attr_10',
  section126Factor: 'regime_value_11',
  section127Agreement: 'regime_value_12',
  // section127Factor: 'regime_value_19',
  twoPartTariff: 'regime_value_16',
  compensationCharge: 'regime_value_17',
  eiucSource: 'regime_value_13',
  eiucSourceFactor: 'line_attr_13',
  waterUndertaker: 'regime_value_14',
  regionalChargingArea: 'regime_value_15',
  eiuc: 'line_attr_14',
  suc: 'line_attr_4',
  chargeValue: 'charge_value',
  credit: 'charge_credit',
  transactionDate: 'transaction_date',
  areaCode: 'line_area_code',
  lineDescription: 'line_description',
  transactionStatus: 'status',
  approvedForBilling: 'approved_for_billing',
  currencyLineAmount: 'currency_line_amount',
  unitOfMeasurePrice: 'unit_of_measure_price',
  preSroc: 'pre_sroc',
  financialYear: 'charge_financial_year',
  transactionType: 'transaction_type',
  transactionReference: 'transaction_reference',
  billRunId: 'bill_run',
  calculation: 'charge_calculation'
}

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
  'transaction_reference AS "transactionReference",' +
  'transaction_type AS "transactionType",' +
  'regime_value_20::int AS "billRunId",' +
  'charge_calculation AS "calculation" ' +
  'FROM transactions'

const CHARGE_PARAMS_MAP = {
  periodStart: 'charge_period_start',
  periodEnd: 'charge_period_end',
  credit: 'charge_credit',
  billableDays: 'billableDays',
  authorisedDays: 'abstractableDays',
  volume: 'volume',
  source: 'source',
  season: 'season',
  loss: 'loss',
  section130Agreement: 'section130Agreement',
  section126Agreement: 'section126Agreement',
  section126Factor: 'abatementAdjustment',
  section127Agreement: 'section127Agreement',
  twoPartTariff: 'secondPartCharge',
  compensationCharge: 'compensationCharge',
  eiucSource: 'eiucSource',
  waterUndertaker: 'waterUndertaker',
  regionalChargingArea: 'region'
}

const CHARGE_RULES_MAP = {
  charge_period_start: 'charge_period_start',
  charge_period_end: 'charge_period_end',
  charge_credit: 'charge_credit',
  billableDays: 'billableDays',
  abstractableDays: 'abstractableDays',
  volume: 'volume',
  source: 'source',
  season: 'season',
  loss: 'loss',
  section130Agreement: 's130Agreement',
  // section126Agreement: 's126Agreement',
  abatementAdjustment: 'abatementAdjustment',
  section127Agreement: 's127Agreement',
  secondPartCharge: 'secondPartCharge',
  compensationCharge: 'compensationCharge',
  eiucSource: 'eiucSource',
  waterUndertaker: 'waterUndertaker',
  region: 'region'
}

// const CALCULATION_MAP = {
//   sourceFactor: 'sourceFactor',
//   seasonFactor: 'seasonFactor',
//   lossFactor: 'lossFactor',
//   s130Agreement: 'licenceHolderChargeAgreement',
//   abatementAdjustment: 'section126Factor',
//   s127Agreement: 'section127Factor',
//   eiucSourceFactor: 'eiucSourceFactor',
//   eiucFactor: 'eiuc',
//   sucFactor: 'suc'
// }

const periodSchema = {
  periodStart: Joi.date().less(Joi.ref('periodEnd')).required(),
  periodEnd: Joi.date().greater(Joi.ref('periodStart')).max('31-MAR-2020').required(),
  credit: Joi.boolean().required()
}

// wrls data scheme and validation
const chargeSchema = {
  ...periodSchema,
  billableDays: Joi.number().integer().min(0).max(366).required(),
  authorisedDays: Joi.number().integer().min(0).max(366).required(),
  volume: Joi.number().positive().required(),
  source: Joi.string().required(),
  season: Joi.string().required(),
  loss: Joi.string().required(),
  section130Agreement: Joi.boolean(),
  section126Agreement: Joi.boolean(),
  section126Factor: Joi.number().allow(null).empty(null).default(1.0),
  section127Agreement: Joi.boolean(),
  twoPartTariff: Joi.boolean().required(),
  compensationCharge: Joi.boolean().required(),
  eiucSource: Joi.string(),
  waterUndertaker: Joi.boolean().required(),
  regionalChargingArea: Joi.string().required()
}

const transactionSchema = {
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
  ...chargeSchema
}

function _translate (data, map) {
  // map data to a scheme
  const mappedData = {}

  const keys = Object.keys(data)
  for (let n = 0; n < keys.length; n++) {
    const mk = map[keys[n]]
    if (mk) {
      mappedData[mk] = data[keys[n]]
    }
  }
  return mappedData
}

function _validateFinancialYear (data) {
  // check the periodStart and periodEnd dates are in the same FY
  const ps = data.periodStart
  const pe = data.periodEnd

  const sy = ps.getFullYear()
  const sm = ps.getMonth()

  const efy = Date.UTC((sm < 3 ? sy : sy + 1), 2, 31)
  // const efy = new Date(Date.UTC((sm < 3 ? sy : sy + 1), 2, 31))

  if (pe > efy) {
    // spoof a Joi style validation error message so we can be consistent
    // higher up
    return {
      error: {
        details: [
          { message: '"periodStart" and "periodEnd" are not in the same financial year' }
        ]
      },
      value: data
    }
  }

  return {
    value: data
  }
}

/**
 * Validate incoming Charge request parameters
 * @param  {object} data   An object containing request params
 * @return {object}    An object containing validated params or error information
 */
function validateCharge (data) {
  let result = Joi.validate(data, chargeSchema, { abortEarly: false })
  if (result.error) {
    return result
  }

  result = _validateFinancialYear(result.value)
  if (result.error) {
    return result
  }

  return result.value
}

/**
 * Validate incoming Create Transaction request parameters
 * @param  {object} data   An object containing request params
 * @return {object}    Object containing validated params or error information
 */
function validateTransaction (data) {
  let result = Joi.validate(data, transactionSchema, { abortEarly: false })
  if (result.error) {
    return result
  }

  result = _validateFinancialYear(result.value)
  if (result.error) {
    return result
  }

  return result.value
}

/**
 * Translate source transaction data scheme into DB naming
 * @param  {object} data   An object containing transaction params
 * @return {object}    Object containing transaction params with translated names
 */
function translateTransaction (data) {
  return _translate(data, ATTRIBUTE_MAP)
}

/**
 * Translate source charge data scheme into DB naming
 * @param  {object} data   An object containing charge params
 * @return {object}    Object containing charge params with translated names
 */
function translateCharge (data) {
  return _translate(data, CHARGE_PARAMS_MAP)
}

/**
 * Translate charge calculation data scheme into WRLS naming
 * @param  {object} data   An object containing charge calculation params
 * @return {object}    Object containing charge calculation with translated names
 */
function translateCalculation (data, output = {}) {
  output.sourceFactor = data.sourceFactor
  output.seasonFactor = data.seasonFactor
  output.lossFactor = data.lossFactor
  output.licenceHolderChargeAgreement = data.s130Agreement
  output.chargeElementAgreement = (data.abatementAdjustment ? data.abatementAdjustment
    : data.s127Agreement)
  output.eiucSourceFactor = data.eiucSourceFactor
  output.eiuc = data.eiucFactor
  output.suc = data.sucFactor

  return output
  // return _translate(data, CALCULATION_MAP)
}

/**
 * Translate charge data DB scheme into payload for chare request
 * @param  {object} data   An object containing charge params in DB naming
 * @return {object}    Charge request payload
 */
function buildChargeRulesPayload (data) {
  return {
    WRLSChargingRequest: _translate(data, CHARGE_RULES_MAP)
  }
}

/**
 * Extracts charge calculation data from rules service response payload
 * @param  {object} data   An object containing charge response
 * @return {object}    Calculation data
 */
function extractCalculation (data, isCredit) {
  const value = Math.round(data.WRLSChargingResponse.chargeValue * 100.0)

  const result = {
    uuid: data.__DecisionID__,
    generatedAt: new Date(),
    calculation: data.WRLSChargingResponse
  }

  const messages = data.WRLSChargingResponse.messages

  if (Array.isArray(messages) && messages.length) {
    return result
  }

  result.chargeValue = (isCredit ? value * -1 : value)
  // if (!data.WRLSChargingResponse.messages || data.WRLSChargingResponse.message.length === 0) {
  //   result.chargeValue = (isCredit ? value * -1 : value)
  // }

  return result
}

/**
 * Assign calculated charge values to transaction attributes, fill in any other data derived values
 * @param {object} transaction Transaction object in regime schema
 * @param {object} charge Object containing the result of a CalculateCharge call
 * @return {object}    Transaction object with charge attributes populated translated into DB schema
 */
function buildTransactionRecord (transaction, charge) {
  // translate calculation elements from rules schema to regime schema
  // const calc = translateCalculation(charge.calculation)
  // const calc = charge.calculation

  transaction = translateCalculation(charge.calculation, transaction)
  // transaction.sourceFactor = calc.sourceFactor
  // transaction.seasonFactor = calc.seasonFactor
  // transaction.lossFactor = calc.lossFactor
  // transaction.licenceHolderChargeAgreement = calc.s130Agreement
  // transaction.chargeElementAgreement = (calc.abatementAdjustment ? calc.abatementAdjustment : calc.s127Agreement)
  // transaction.eiucSourceFactor = calc.eiucSourceFactor
  // transaction.eiuc = calc.eiucFactor
  // transaction.suc = calc.sucFactor

  const chargeValue = charge.chargeValue
  transaction.chargeValue = chargeValue
  transaction.currencyLineAmount = chargeValue
  transaction.unitOfMeasurePrice = chargeValue
  transaction.calculation = charge

  transaction.financialYear = utils.financialYearFromDate(transaction.periodStart)
  transaction.prorataDays = `${transaction.billableDays}/${transaction.authorisedDays}`
  transaction.preSroc = true

  return translateTransaction(transaction)
}

/**
 * Generate basic query to select transaction data using translated naming
 * @return {string}    SQL SELECT statement of attributes mapped to source schema naming
 */
function transactionQuery () {
  return TRANSACTION_QUERY
  // const names = Object.entries(ATTRIBUTE_MAP).map(e => {
  //   return `${e[1]} AS "${e[0]}"`
  // })

  // return `SELECT id,${names.join(',')} FROM transactions`
}

/**
 * Generate order clause for select transaction data using translated naming
 * @param {string or Array} sort  Array or CSV list of sort columns in WRLS naming
 * @param {string} sortDir Direction of sort either 'asc' (default) or 'desc'
 * @return {Array}    Array of order clause items in DB naming scheme
 */
function orderQuery (sort, sortDir) {
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
      const col = ATTRIBUTE_MAP[cols[i]]
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

  console.log(order)
  return order
}

/**
 * Extract charge request data from transaction data
 * @param {object} data Payload containing charge data
 * @return {Object}  Object containing extracted params
 */
function extractChargeParams (data) {
  const chargeData = {}
  Object.keys(chargeSchema).forEach(k => {
    if (data[k]) {
      chargeData[k] = data[k]
    }
  })
  return chargeData
}

module.exports = {
  validateCharge,
  translateCharge,
  validateTransaction,
  translateTransaction,
  transactionQuery,
  orderQuery,
  extractChargeParams,
  buildChargeRulesPayload,
  extractCalculation,
  translateCalculation,
  buildTransactionRecord,
  ATTRIBUTE_MAP
}
