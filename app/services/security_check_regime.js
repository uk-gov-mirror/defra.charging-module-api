// Security and authorisation placeholder
const Boom = require('@hapi/boom')
const Regime = require('../models/regime')

async function checkRegimeValid (slug) {
  const regime = await Regime.find(slug)

  if (!regime) {
    throw Boom.notFound(`Regime '${slug}' not found`)
  }

  if (!isAuthorisedRegime(regime.id)) {
    throw Boom.forbidden(`Unauthorised for regime '${slug}'`)
  }

  return regime
}

function isAuthorisedRegime (regimeId) {
  // TODO: check requestor is permitted to access regime resources
  return true
}

module.exports = {
  call: checkRegimeValid
}
