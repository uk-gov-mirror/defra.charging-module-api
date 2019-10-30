// const rp = require('request-promise')
// const config = require('../../../config/config')

async function calculateCharge (regime, chargeParams) {
  // mock this for now until rules are ready
  // return rp(buildRequest(regime, chargeParams))
  return {
    __DecisionID__: '46b5777c-8de0-40d0-823d-3d8583aaa287',
    tcmChargingResponse: {
      chargeValue: 1234,
      messages: null,
      standardUnitCharge: 100,
      volumeFactor: 100,
      sourceFactor: 100,
      seasonFactor: 100,
      lossFactor: 100,
      abatementAdjustment: 'wigwam',
      s127Agreement: 'peanut',
      s130Agreement: 'windmill',
      eiucSource: 100,
      eiucFactor: 100
    }
  }
}

// async function replyWithError (error) {
//   let payload = {}

//   try {
//     if (typeof(error.error) !== "undefined" && error.error !== null) {
//       payload = { calculation: { messages: error.error.message } }
//     } else {
//       payload = { calculation: { messages: error.message } }
//     }
//     console.log("========== Handling error from Rules service ==========")
//     console.log(payload)
//     console.log("=======================================================")
//     this.reply(payload).code(500)
//   } catch (err) {
//     console.log(err)
//   }
// }

/**
 * Build the request to the decision service endpoint
 * @param  {object} regime    The regime making the request
 * @param  {object} payload    Charge parameters
 * @return {object} Request options for call to decision service
 */
// function buildRequest (regime, payload) {
//   // Rules service details
//   const service = config.decisionService
//   // The rules service end-points are per regime
//   // Charge financial year is used to infer version of end-point application
//   const year = payload.financialYear
//   // Charge request data to pass to rules service
//   const chargeRequest = payload.chargeRequest

//   const options = {
//     method: 'POST',
//     uri: makeRulesPath(regime, year),
//     body: {},
//     json: true,
//     auth: {
//       username: service.username,
//       password: service.password
//     }
//   }

//   if (regime.slug === 'wrls') {
//     options.body['request'] = chargeRequest
//   } else {
//     options.body['tcmChargingRequest'] = chargeRequest
//   }

//   if (config.httpProxy) {
//     options['proxy'] = config.httpProxy
//   }

//   return options
// }

// buildReply (data) {
//   return ({
//     uuid: data.__DecisionID__,
//     generatedAt: new Date(),
//     calculation: data.tcmChargingResponse
//   })
// }

// function makeRulesPath (regime, year) {
//   // generate the url for the correct regime, year and ruleset
//   const endpoint = config.decisionService.endpoints[regime.slug.toLowerCase()]
//   const fy = '_' + year + '_' + (year - 1999)
//   return (
//     config.decisionService.url + '/' + endpoint.application + '/' + endpoint.ruleset + fy
//   )
// }

// makeOldRulesPath (regime, year) {
//   // generate the url for the correct regime, year and ruleset
//   const endpoint = config.endpoints[regime.toLowerCase()]
//   return (
//     config.decisionService.url + '/' + endpoint.application + '/' + endpoint.ruleset
//   )
// }

module.exports = {
  calculateCharge
}

// Example usage:
//
// list('upload', { Prefix: 'export'}).then(items => console.log(items, items.length)).catch(err => console.error(err))

// download('upload', 'export/wml/WMLTI50016T.DAT', 'myfile.txt')

// upload('archive', 'tony.txt', './Dockerfile').then(v => console.log(v)).catch(err => console.log(err.message))
