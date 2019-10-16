const Joi = require('@hapi/joi')

const inputSchema = Joi.object({
  region: Joi.string().uppercase().length(1).required(),
  charge_period_start: Joi.string().required(),
  charge_period_end: Joi.string().required(),
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
  charge_credit: Joi.boolean().required(),
  transaction_date: Joi.date(),
  area_code: Joi.string(),
  line_description: Joi.string()
})


function validateTransactionData (data) {
  const result = inputSchema.validate(data)

}

function validateSrocTransactionData (data) {

}

function WrlsTransaction (data) {
  this.attrs = data
  this.validation = null
  this.error = false
}

WrlsTransaction.prototype = {
  constructor: WrlsTransaction,

  validate: function () {
    this.validation = inputSchema.validate(this.data)
    this.error = !!this.validation.error
    return this.error
  }
}


const INPUT_TRANSACTION = {
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


const OUTPUT_TRANSACTION = {
  id: 'id',
  region: 'region',
  charge_period_start: 'charge_period_start',
  charge_period_end: 'charge_period_end',
  customer_reference: 'customer_reference',
  batch_number: 'regime_value_1',
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
  eiuc_adjusted_source_factor: 'line_attr_13',
  water_undertaker: 'regime_value_14',
  suc_eiuc_region: 'regime_value_15',
  eiuc: 'line_attr_14',
  suc: 'line_attr_4',
  charge_value: 'unit_of_measure_price',
  credit: 'charge_credit',
  transaction_date: 'transaction_date',
  line_description: 'line_description',
  area_code: 'line_area_code'

  sequence_number: 'sequence_number',
  transaction_date: 'transaction_date',
  transaction_type: 'transaction_type',
  transaction_reference: 'transaction_reference',
  related_reference: 'related_reference',
  currency_code: 'currency_code',
  header_narrative: 'header_narrative',
  header_attr_1: 'header_attr_1',
  header_attr_2: 'header_attr_2',
  header_attr_3: 'header_attr_3',
  header_attr_4: 'header_attr_4',
  header_attr_5: 'header_attr_5',
  header_attr_6: 'header_attr_6',
  header_attr_7: 'header_attr_7',
  header_attr_8: 'header_attr_8',
  header_attr_9: 'header_attr_9',
  header_attr_10: 'header_attr_10',
  currency_line_amount: 'currency_line_amount',
  line_vat_code: 'line_vat_code',
  line_area_code: 'line_area_code',
  line_description: 'line_description',
  line_income_stream_code: 'line_income_stream_code',
  line_context_code: 'line_context_code',
  line_attr_1: 'line_attr_1',
  line_attr_2: 'line_attr_2',
  line_attr_3: 'line_attr_3',
  line_attr_4: 'line_attr_4',
  line_attr_5: 'line_attr_5',
  line_attr_6: 'line_attr_6',
  line_attr_7: 'line_attr_7',
  line_attr_8: 'line_attr_8',
  line_attr_9: 'line_attr_9',
  line_attr_10: 'line_attr_10',
  line_attr_11: 'line_attr_11',
  line_attr_12: 'line_attr_12',
  line_attr_13: 'line_attr_13',
  line_attr_14: 'line_attr_14',
  line_attr_15: 'line_attr_15',
  line_quantity: 'line_quantity',
  unit_of_measure: 'unit_of_measure',
  unit_of_measure_price: 'unit_of_measure_price',
  pre_sroc: 'pre_sroc',
  approved_for_billing: 'approved_for_billing',
  approved_for_billing_at: 'approved_for_billing_at',
  charge_calculation: 'charge_calculation',
  charge_financial_year: 'charge_financial_year',
  charge_credit: 'charge_credit',
  regime_value_1: 'regime_value_1',
  regime_value_2: 'regime_value_2',
  regime_value_3: 'regime_value_3',
  regime_value_4: 'regime_value_4',
  regime_value_5: 'regime_value_5',
  regime_value_6: 'regime_value_6',
  regime_value_7: 'regime_value_7',
  regime_value_8: 'regime_value_8',
  regime_value_9: 'regime_value_9',
  regime_value_10: 'regime_value_10',
  regime_value_11: 'regime_value_11',
  regime_value_12: 'regime_value_12',
  regime_value_13: 'regime_value_13',
  regime_value_14: 'regime_value_14',
  regime_value_15: 'regime_value_15'
}

const INPUT_SROC_TRANSACTION = {

}

const OUTPUT_SROC_TRANSACTION = {

}

const TRANSACTION_MAP = {
  sequence_number: 'sequence_number',
  customer_reference: 'customer_reference',
  transaction_date: 'transaction_date',
  transaction_type: 'transaction_type',
  transaction_reference: 'transaction_reference',
  related_reference: 'related_reference',
  currency_code: 'currency_code',
  header_narrative: 'header_narrative',
  header_attr_1: 'header_attr_1',
  header_attr_2: 'header_attr_2',
  header_attr_3: 'header_attr_3',
  header_attr_4: 'header_attr_4',
  header_attr_5: 'header_attr_5',
  header_attr_6: 'header_attr_6',
  header_attr_7: 'header_attr_7',
  header_attr_8: 'header_attr_8',
  header_attr_9: 'header_attr_9',
  header_attr_10: 'header_attr_10',
  currency_line_amount: 'currency_line_amount',
  line_vat_code: 'line_vat_code',
  line_area_code: 'line_area_code',
  line_description: 'line_description',
  line_income_stream_code: 'line_income_stream_code',
  line_context_code: 'line_context_code',
  line_attr_1: 'line_attr_1',
  line_attr_2: 'line_attr_2',
  line_attr_3: 'line_attr_3',
  line_attr_4: 'line_attr_4',
  line_attr_5: 'line_attr_5',
  line_attr_6: 'line_attr_6',
  line_attr_7: 'line_attr_7',
  line_attr_8: 'line_attr_8',
  line_attr_9: 'line_attr_9',
  line_attr_10: 'line_attr_10',
  line_attr_11: 'line_attr_11',
  line_attr_12: 'line_attr_12',
  line_attr_13: 'line_attr_13',
  line_attr_14: 'line_attr_14',
  line_attr_15: 'line_attr_15',
  line_quantity: 'line_quantity',
  unit_of_measure: 'unit_of_measure',
  unit_of_measure_price: 'unit_of_measure_price',
  region: 'region',
  pre_sroc: 'pre_sroc',
  approved_for_billing: 'approved_for_billing',
  approved_for_billing_at: 'approved_for_billing_at',
  charge_period_start: 'charge_period_start',
  charge_period_end: 'charge_period_end',
  charge_calculation: 'charge_calculation',
  charge_financial_year: 'charge_financial_year',
  charge_credit: 'charge_credit',
  regime_value_1: 'regime_value_1',
  regime_value_2: 'regime_value_2',
  regime_value_3: 'regime_value_3',
  regime_value_4: 'regime_value_4',
  regime_value_5: 'regime_value_5',
  regime_value_6: 'regime_value_6',
  regime_value_7: 'regime_value_7',
  regime_value_8: 'regime_value_8',
  regime_value_9: 'regime_value_9',
  regime_value_10: 'regime_value_10',
  regime_value_11: 'regime_value_11',
  regime_value_12: 'regime_value_12',
  regime_value_13: 'regime_value_13',
  regime_value_14: 'regime_value_14',
  regime_value_15: 'regime_value_15'
}

module.exports = {
  inputMap: INPUT_TRANSACTION,
  outputMap: OUTPUT_TRANSACTION
}
