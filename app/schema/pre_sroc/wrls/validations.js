// common validations
const Joi = require('@hapi/joi')

const InvalidCharsRegEx = /^[^?^£\u2014\u2264\u2265]*$/
const ValidRegions = ['A', 'B', 'E', 'N', 'S', 'T', 'W', 'Y']
const ValidAreaCodes = [
  'ARCA',
  'AREA',
  'ARNA',
  'CASC',
  'MIDLS',
  'MIDLT',
  'MIDUS',
  'MIDUT',
  'AACOR',
  'AADEV',
  'AANWX',
  'AASWX',
  'NWCEN',
  'NWNTH',
  'NWSTH',
  'HAAR',
  'KAEA',
  'SAAR',
  'AGY2N',
  'AGY2S',
  'AGY3',
  'AGY3N',
  'AGY3S',
  'AGY4N',
  'AGY4S',
  'N',
  'SE',
  'SE1',
  'SE2',
  'SW',
  'ABNRTH',
  'DALES',
  'NAREA',
  'RIDIN',
  'DEFAULT',
  'MULTI'
]

module.exports = {
  invalidCharsRx: InvalidCharsRegEx,
  stringValidator: Joi.string().trim().regex(InvalidCharsRegEx),
  regionValidator: Joi.string().uppercase().length(1).valid(ValidRegions).required(),
  customerReferenceValidator: Joi.string().trim().uppercase().max(12).regex(InvalidCharsRegEx).required(),
  areaCodeValidator: Joi.string().trim().uppercase().valid(...ValidAreaCodes).required()
}
