// Pre-SRoC Transaction Queue =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const { logger } = require('../../lib/logger')
const SecurityCheckRegime = require('../../services/security_check_regime')
const GenerateBillRun = require('../../services/generate_bill_run')
const GenerateRegionCustomerFile = require('../../services/generate_region_customer_file')
const Schema = require('../../schema/pre_sroc')

const basePath = '/v1/{regime_id}/billruns'

// POST create a billing run
// request payload = {
//  draft: true,
//  region: 'A',
//  filter: {
//    batchNumber: 'XXX111',
//    customerReference: 'ABC123'
//  }
// }
//
// response.payload = {
// "billRunId": 10059,
// "region": "A",
// "draft": true,
// "summary": {
//     "creditNoteCount": 3,
//     "creditNoteValue": -1402,
//     "invoiceCount": 24,
//     "invoiceValue": 501016,
//     "creditLineCount": 3,
//     "creditLineValue": -1402,
//     "debitLineCount": 28,
//     "debitLineValue": 501016,
//     "netTotal": 499614
// },
// "customers": [
//     {
//         "customerReference": "A10656902A",
//         "summaryByFinancialYear": [
//             {
//                 "financialYear": 2019,
//                 "creditLineCount": 0,
//                 "creditLineValue": 0,
//                 "debitLineCount": 1,
//                 "debitLineValue": 1346,
//                 "netTotal": 1346,
//                 "transactions": [
//                     {
//                         "id": "5bb14d9a-0a69-48ae-99b9-15a19d866bd3",
//                         "chargeValue": 1346
//                     }
//                 ]
//             }
//         ]
//     },
//  ...
//   ],
//  "filename": "nalai50004.dat",
//  "id": "f5a9164c-aecf-45df-9c0c-8fff70b83048"
// }
async function create (req, h) {
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    // process and add transaction(s) in payload
    const payload = req.payload
    if (!payload) {
      // return HTTP 400
      return Boom.badRequest('No payload')
    }

    // load the correct schema for the regime
    const schema = Schema[regime.slug]

    // create a BillRun object, validate and translate
    const billRun = await schema.BillRun.instanceFromRequest(regime.id, payload)

    const summary = await GenerateBillRun.call(billRun)

    if (!billRun.draft) {
      // check if any customer changes are waiting to be exported for this region
      const customerFile = await GenerateRegionCustomerFile.call(regime, billRun.region)
      if (customerFile.changesCount > 0) {
        // we have a file
        summary.addCustomerFile(customerFile)
        // summary.customerFilename = customerFile.filename
      }
    }

    // return HTTP 201 Created unless a draft
    const response = h.response(summary)

    if (billRun.draft) {
      response.code(200)
    } else {
      response.code(201)
      response.header('Location', regimeBillRunPath(regime, summary.id))
    }

    return response
  } catch (err) {
    logger.error(err.stack)
    if (Boom.isBoom(err)) {
      // status 500 squashes error message for some reason
      if (err.output.statusCode === 500) {
        err.output.payload.message = err.message
      }
      return err
    } else if (err.isJoi) {
      return Boom.badData(err.details.map(e => e.message).join(', '))
    } else {
      return Boom.boomify(err)
    }
  }
}

function regimeBillRunPath (regime, billRunId) {
  return `${config.environment.serviceUrl}/v1/${regime.slug}/billruns/${billRunId}`
}

const routes = [
  {
    method: 'POST',
    path: basePath,
    handler: create
  }
]

module.exports = {
  routes
}
