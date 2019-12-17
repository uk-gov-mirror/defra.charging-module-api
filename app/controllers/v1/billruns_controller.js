// Pre-SRoC Transaction Queue =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const { logger } = require('../../lib/logger')
const SecurityCheckRegime = require('../../services/security_check_regime')
const GenerateBillRun = require('../../services/generate_bill_run')
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
// response payload = {
//   id: '123124-123123-123123',
//   summary: {
//     creditCount: 1,
//     debitCount: 3,
//     creditTotal: 1234567,
//     debitTotal: 2124124,
//     total: 121212
//   },
//   customers: [
//    {
//      customerReference: 'AB123545',
//      financialYears: {
//        2019: {
//          creditCount: 0,
//          debitCount: 1,
//          creditTotal: 0,
//          debitTotal: 32303,
//          total: 32303,
//          transactions: [
//            { id: '123123123', chargeValue: -2332 }
//          ],
//          additionalTransactions: [
//            { id: 'dummy123', chargeValue: 123 }
//          ]
//        }
//      }
//    }
//   ]
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

    const summary = await GenerateBillRun.call(billRun, schema)

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
