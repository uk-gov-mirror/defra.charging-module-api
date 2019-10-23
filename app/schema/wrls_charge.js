// WRLS pre-sroc charge presenter
const Joi = require('@hapi/joi')

const INPUT_TO_RULES = {
  periodStart: 'charge_period_start',
  periodEnd: 'charge_period_end',
  credit: 'charge_credit',
  chargeParams: 'chargeParams'
}

const OUTPUT_MAP = {
  sourceFactor: 'line_attr_6',
  seasonFactor: 'line_attr_7',
  lossFactor: 'line_attr_8',
  section130Factor: '',
  section127Factor: '',
  twoPartTariff: '',
  compensationCharge: '',
  eiucSourceFactor: 'line_attr_13',
  eiuc: 'line_attr_14',
  suc: 'line_attr_4',
  chargeValue: 'currency_line_amount'
}

const CHARGE_PARAMS_MAP = {
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

// validate and map incoming transaction data to DB naming
function validate (data) {
  const chargeSchema = Joi.object({
    billableDays: Joi.number().integer().positive().max(366).required(),
    authorisedDays: Joi.number().integer().positive().max(366).required(),
    volume: Joi.number().positive().required(),
    source: Joi.string().required(),
    season: Joi.string().required(),
    loss: Joi.string().required(),
    section130Agreement: Joi.string(),
    section126Agreement: Joi.string(),
    section126Factor: Joi.number(),
    section127Agreement: Joi.string(),
    twoPartTariff: Joi.boolean().truthy('Y').falsy('N').required(),
    compensationCharge: Joi.boolean().truthy('Y').falsy('N').required(),
    eiucSource: Joi.string().required(),
    waterUndertaker: Joi.boolean().truthy('Y').falsy('N').required(),
    regionalChargingArea: Joi.string().required()
  })

  const schema = Joi.object({
    periodStart: Joi.date().required(),
    periodEnd: Joi.date().required(),
    credit: Joi.boolean().required(),
    chargeParams: chargeSchema.required()
  })

  const result = schema.validate(data, { abortEarly: false })
  if (result.error) {
    return result
  }

  return result.value
}

function regimeToRules (data) {
  // map the WRLS names to Rule Service names
  return _translate(data, INPUT_TO_RULES)
}

function _translate (data, map) {
  // map data to a scheme
  const mappedData = {}

  const keys = Object.keys(data)
  for (let n = 0; n < keys.length; n++) {
    const mk = map[keys[n]]
    if (mk === 'chargeParams') {
      mappedData[mk] = _translate(data[keys[n]], CHARGE_PARAMS_MAP)
    } else {
      mappedData[mk] = data[keys[n]]
    }
  }
  return mappedData
}

module.exports = {
  validate,
  regimeToRules
}
