const Joi = require('@hapi/joi')
const query = require('../services/query/regime.js')

function Regime () {
  this.attrs = null
  this.errors = null
}

// statics
Regime.find = function (slug) {
  return query.findBySlug(slug)
}

Regime.all = function () {
}

Regime.schema = function () {
  return {
    slug: Joi.string().required(),
    name: Joi.string().required()
  }
}

// instance methods
Regime.prototype = {
  constructor: Regime,

  save: function () {
  },

  update: function () {
  },

  validate: function () {
    const { error, value } = Joi.validate(this.attrs, Regime.schema(),
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

module.exports = Regime
