const Boom = require('@hapi/boom')

function dbError (err) {
  if (err.code && err.detail) {
    return Boom.badData(err.detail)
  }
  return err
}

module.exports = {
  dbError
}
