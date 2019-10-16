const query = require('../services/query/transaction.js')

function Transaction (regime = null, attrs = null) {
  this.regime = regime
  this.attrs = attrs
  this.errors = null
}

// statics
Transaction.find = function (id) {
}

Transaction.findByRegime = function (regimeId, params = {}) {
  return query.findByRegime(regimeId, params)
}

// instance methods
Transaction.prototype = {
  save: function () {
  },

  update: function () {
  },

  isValid: function () {
  }
}

Transaction.prototype.constructor = Transaction

module.exports = Transaction
