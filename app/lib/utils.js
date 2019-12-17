const Joi = require('@hapi/joi')
const config = require('../../config/config')

function isValidUUID (id) {
  const uuid = '' + id
  return uuid.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/) !== null
}

function financialYearFromDate (date) {
  return (date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear())
}

function translateData (data, map) {
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

function validatePagination (page, perPage) {
  const schema = {
    page: Joi.number().integer().positive().default(config.pagination.page),
    perPage: Joi.number().integer().positive().default(config.pagination.perPage)
  }

  const result = Joi.validate({ page: page, perPage: perPage }, schema)

  if (result.error) {
    return config.pagination
  } else {
    return result.value
  }
}

// TODO: this is WRLS specific at the moment
function validateFinancialYear (data) {
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

function buildWhereClause (filter) {
  const where = []
  const values = []
  let attrCount = 1

  Object.keys(filter).forEach(k => {
    where.push(`${k} = $${attrCount++}`)
    values.push(filter[k])
  })

  return {
    where: where.join(' AND '),
    values
  }
}

module.exports = {
  isValidUUID,
  financialYearFromDate,
  translateData,
  validateFinancialYear,
  validatePagination,
  buildWhereClause
}
