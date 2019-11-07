const Joi = require('@hapi/joi')

// SRoC Data Maps ===================

const ATTRIBUTE_MAP = {
  region: 'region',
  periodStart: 'charge_period_start',
  periodEnd: 'charge_period_end',
  customerReference: 'customer_reference',
  batchNumber: 'regime_value_1',
  requestDate: 'regime_value_2',
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
  section130Factor: 'regime_value_18',
  section126Agreement: 'regime_value_10',
  section126Factor: 'regime_value_11',
  section127Agreement: 'regime_value_12',
  section127Factor: 'regime_value_19',
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
  approvedForBilling: 'approved_for_billing'
}

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

const periodSchema = {
  periodStart: Joi.date().less(Joi.ref('periodEnd')).min('01-APR-2020').required(),
  periodEnd: Joi.date().greater(Joi.ref('periodStart')).required(),
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
  section130Agreement: Joi.string().allow('', null),
  section126Agreement: Joi.string().allow('', null),
  section126Factor: Joi.number().allow(null),
  section127Agreement: Joi.string().allow('', null),
  twoPartTariff: Joi.boolean().truthy('Y').falsy('N').required(),
  compensationCharge: Joi.boolean().truthy('Y').falsy('N').required(),
  eiucSource: Joi.string().required(),
  waterUndertaker: Joi.boolean().truthy('Y').falsy('N').required(),
  regionalChargingArea: Joi.string().required()
}

const transactionSchema = {
  region: Joi.string().uppercase().length(1).required(),
  customerReference: Joi.string().uppercase().required(),
  batchNumber: Joi.string().allow('', null),
  requestDate: Joi.date().allow('', null),
  invoiceDate: Joi.date().required(),
  licenceNumber: Joi.string().required(),
  chargePeriod: Joi.string().required(),
  chargeElementId: Joi.string().allow('', null),
  prorataDays: Joi.string().regex(/^\d{1,3}\/\d{1,3}$/),
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
    mappedData[mk] = data[keys[n]]
  }
  return mappedData
}

function _validateFinancialYear (data) {
  // check the periodStart and periodEnd dates are in the same FY
  const ps = data.periodStart
  const pe = data.periodEnd

  const sy = ps.getFullYear()
  const sm = ps.getMonth()

  const efy = new Date(Date.UTC((sm < 3 ? sy : sy + 1), 2, 31))

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
 * Generate basic query to select transaction data using translated naming
 * @return {string}    SQL SELECT statement of attributes mapped to source schema naming
 */
function transactionQuery () {
  const names = Object.entries(ATTRIBUTE_MAP).map(e => {
    return `${e[1]} AS "${e[0]}"`
  })

  return `SELECT id,${names.join(',')} FROM transactions`
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
  extractChargeParams,
  ATTRIBUTE_MAP
}
