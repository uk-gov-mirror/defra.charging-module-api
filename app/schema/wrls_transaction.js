// WRLS pre-sroc transaction presenter
const Joi = require('@hapi/joi')
// const DataMap = require('../services/datamaps')
const ATTRIBUTE_MAP = {
  region: 'region',
  period_start: 'charge_period_start',
  period_end: 'charge_period_end',
  customer_reference: 'customer_reference',
  batch_number: 'regime_value_1',
  request_date: 'regime_value_2',
  invoice_date: 'header_attr_1',
  licence_number: 'line_attr_1',
  charge_period: 'line_attr_2',
  charge_element_id: 'regime_value_3',
  billable_days: 'regime_value_4',
  authorised_days: 'regime_value_5',
  prorata_days: 'line_attr_3',
  volume: 'line_attr_5',
  source: 'regime_value_6',
  season: 'regime_value_7',
  loss: 'regime_value_8',
  section_130_agreement: 'regime_value_9',
  section_126_agreement: 'regime_value_10',
  section_126_factor: 'regime_value_11',
  section_127_agreement: 'regime_value_12',
  eiuc_adjusted_source: 'regime_value_13',
  water_undertaker: 'regime_value_14',
  suc_eiuc_region: 'regime_value_15',
  credit: 'charge_credit',
  transaction_date: 'transaction_date',
  line_description: 'line_description',
  area_code: 'line_area_code'
}

// validate and map incoming transaction data to DB naming
function validate (data) {
  // const dataMap = await DataMap.regimeTransactionMap(regime.id)

  const schema = Joi.object({
    region: Joi.string().uppercase().length(1).required(),
    period_start: Joi.date().required(),
    period_end: Joi.date().required(),
    customer_reference: Joi.string().uppercase().required(),
    batch_number: Joi.string(),
    request_date: Joi.date(),
    invoice_date: Joi.date(),
    licence_number: Joi.string(),
    charge_period: Joi.string(),
    charge_element_id: Joi.string(),
    billable_days: Joi.number().positive().max(366),
    authorised_days: Joi.number().positive().max(366),
    prorata_days: Joi.string().regex(/^\d{1,3}\/\d{1,3}$/),
    volume: Joi.string(),
    source: Joi.string(),
    season: Joi.string(),
    loss: Joi.string(),
    section_130_agreement: Joi.boolean(),
    section_126_agreement: Joi.boolean(),
    section_126_factor: Joi.any(),
    section_127_agreement: Joi.boolean(),
    eiuc_adjusted_source: Joi.string(),
    water_undertaker: Joi.boolean(),
    suc_eiuc_region: Joi.string(),
    credit: Joi.boolean().required(),
    transaction_date: Joi.date(),
    area_code: Joi.string(),
    line_description: Joi.string()
  })

  const result = schema.validate(data, { abortEarly: false })
  if (result.error) {
    return result
  }

  return result.value
}

function translate (data) {
  // map the WRLS names to DB names
  const mappedData = {}

  const keys = Object.keys(data)
  for (let n = 0; n < keys.length; n++) {
    const mk = ATTRIBUTE_MAP[keys[n]]
    mappedData[mk] = data[keys[n]]
  }
  return mappedData
}

function select () {
  const names = Object.entries(ATTRIBUTE_MAP).map(e => {
    return `${e[1]} AS ${e[0]}`
  })

  return `SELECT id,${names.join(',')} FROM transactions`
}

module.exports = {
  ATTRIBUTE_MAP,
  validate,
  translate,
  select
}
