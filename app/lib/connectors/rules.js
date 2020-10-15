const rp = require('request-promise-native')
const config = require('../../../config/config')

const YEAR_SUFFIX = {
  2000: '_2000_01',
  2001: '_2001_02',
  2002: '_2002_03',
  2003: '_2003_04',
  2004: '_2004_05',
  2005: '_2005_06',
  2006: '_2006_07',
  2007: '_2007_08',
  2008: '_2008_09',
  2009: '_2009_10',
  2010: '_2010_11',
  2011: '_2011_12',
  2012: '_2012_13',
  2013: '_2013_14',
  2014: '_2014_15',
  2015: '_2015_16',
  2016: '_2016_17',
  2017: '_2017_18',
  2018: '_2018_19',
  2019: '_2019_20',
  2020: '_2020_21'
}

async function calculateCharge (regime, financialYear, chargeParams) {
  // Rules service details
  const service = config.decisionService

  const uri = makeRulesPath(regime, financialYear)
  // The rules service end-points are per regime
  const options = {
    method: 'POST',
    uri: uri,
    body: chargeParams,
    timeout: 1500,
    json: true,
    auth: {
      username: service.username,
      password: service.password
    }
  }

  if (config.httpProxy) {
    options.proxy = config.httpProxy
  }
  return rp(options)
}

function makeRulesPath (regime, year) {
  // generate the url for the correct regime, year and ruleset
  const endpoint = config.decisionService.endpoints[regime.slug.toLowerCase()]
  const suffix = YEAR_SUFFIX[year]

  return (
    config.decisionService.url + '/' + endpoint.application + '/' + endpoint.ruleset + suffix
  )
}

module.exports = {
  calculateCharge
}
