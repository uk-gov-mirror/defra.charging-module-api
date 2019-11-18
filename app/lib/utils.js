function isValidUUID (id) {
  const uuid = '' + id
  return uuid.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/) !== null
}

function financialYearFromDate (date) {
  return (date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear())
}

module.exports = {
  isValidUUID,
  financialYearFromDate
}
