const Joi = require('@hapi/joi')
const query = require('../services/query/transaction.js')

function Transaction () {
  this.attrs = null
  this.errors = null
}

// statics
Transaction.find = function (id) {
}

Transaction.findByRegime = function (regimeId, params = {}) {
  return query.findByRegime(regimeId, params)
}

Transaction.schema = function () {
  return {
    slug: Joi.string().required(),
    name: Joi.string().required()
  }
}

// instance methods
Transaction.prototype = {
  save: function () {
  },

  update: function () {
  },

  validate: function () {
    const { error, value } = Joi.validate(this.attrs, Transaction.schema(),
      { abortEarly: false })
    if (error) {
      this.errors = error.details
      return false
    } else {
      Object.assign(this.attrs, value)
      this.errors = null
      return true
    }
  }
}

Transaction.prototype.constructor = Transaction

module.exports = Transaction
