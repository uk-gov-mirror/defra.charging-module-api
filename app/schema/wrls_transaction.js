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
  source_factor: 'line_attr_6',
  season: 'regime_value_7',
  season_factor: 'line_attr_7',
  loss: 'regime_value_8',
  loss_factor: 'line_attr_8',
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

const MASTER_MAP = {
  region: {
    colName: 'region',
    validation: Joi.string().uppercase().length(1).required(),
    visible: true
  },
  period_start: {
    colName: 'charge_period_start',
    validation: Joi.date().required(),
    visible: true
  },
  period_end: {
    colName: 'charge_period_end',
    validation: Joi.date().required(),
    visible: true
  },
  customer_reference: {
    colName: 'customer_reference',
    validation: Joi.string().required(),
    visible: true
  },
  batch_number: {
    colName: 'regime_value_1',
    validation: Joi.string(),
    visible: true
  },
  request_date: {
    colName: 'regime_value_2',
    validation: Joi.date(),
    visible: true
  },
  invoice_date: {
    colName: 'header_attr_1',
    validation: Joi.date(),
    visible: true
  },
  licence_number: {
    colName: 'line_attr_1',
    validation: Joi.string(),
    visible: true
  },
  charge_period: {
    colName: 'line_attr_2',
    validation: Joi.string(),
    visible: true
  },
  charge_element_id: {
    colName: 'regime_value_3',
    validation: Joi.string(),
    visible: true
  },
  billable_days: {
    colName: 'regime_value_4',
    validation: Joi.number().positive().max(366),
    visible: true
  },
  authorised_days: {
    colName: 'regime_value_5',
    validation: Joi.number().positive().max(366),
    visible: true
  },
  prorata_days: {
    colName: 'line_attr_3',
    validation: Joi.string().regex(/^\d{1,3}\/\d{1,3}$/),
    visible: true
  },
  volume: {
    colName: 'line_attr_5',
    validation: Joi.string(),
    visible: true
  },
  source: {
    colName: 'regime_value_6',
    validation: Joi.string(),
    visible: true
  },
  source_factor: {
    colName: 'line_attr_6',
    validation: Joi.string(),
    visible: true
  },
  season: {
    colName: 'regime_value_7',
    validation: Joi.string(),
    visible: true
  },
  season_factor: {
    colName: 'line_attr_7',
    validation: Joi.string(),
    visible: true
  },
  loss: {
    colName: 'regime_value_8',
    validation: Joi.string(),
    visible: true
  },
  loss_factor: {
    colName: 'line_attr_8',
    visible: true
  },
  section_130_agreement: {
    colName: 'regime_value_9',
    validation: Joi.string(),
    visible: true
  },
  section_126_agreement: {
    colName: 'regime_value_10',
    validation: Joi.string(),
    visible: true
  },
  section_126_factor: {
    colName: 'regime_value_11',
    validation: Joi.string(),
    visible: true
  },
  section_127_agreement: {
    colName: 'regime_value_12',
    validation: Joi.string(),
    visible: true
  },
  section_127_factor: {
    colName: 'regime_value_13',
    visible: true
  },
  eiuc_adjusted_source: {
    colName: 'regime_value_14',
    validation: Joi.string(),
    visible: true
  },
  eiuc_adjusted_source_factor: {
    colName: 'regime_value_15',
    visible: true
  },
  water_undertaker: {
    colName: 'regime_value_16',
    validation: Joi.boolean(),
    visible: true
  },
  suc_eiuc_region: {
    colName: 'regime_value_17',
    validation: Joi.string(),
    visible: true
  },
  eiuc: {
    colName: 'line_attr_14',
    visible: true
  },
  suc: {
    colName: 'line_attr_4',
    visible: true
  },
  charge_value: {
    colName: 'charge_value',
    visible: true
  },
  credit: {
    colName: 'charge_credit',
    validation: Joi.boolean(),
    visible: true
  },
  transaction_date: {
    colName: 'transaction_date',
    validation: Joi.date(),
    visible: true
  },
  line_description: {
    colName: 'line_description',
    validation: Joi.string(),
    visible: true
  },
  area_code: {
    colName: 'line_area_code',
    validation: Joi.string(),
    visible: true
  },
  transaction_status: {
    colName: 'status',
    visible: true
  },
  approved_for_billing: {
    colName: 'approved_for_billing',
    visible: true
  }
}

// validate and map incoming transaction data to DB naming
function validate (data) {
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
