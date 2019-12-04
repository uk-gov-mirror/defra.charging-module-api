// Pre-SRoC Transaction Queue =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const { logger } = require('../../lib/logger')
const SecurityCheckRegime = require('../../services/security_check_regime')
// const RunBilling = require('../../services/run_billing')
const Schema = require('../../schema/pre_sroc')
const BillRun = require('../../schema/pre_sroc/wrls/bill_run')
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

    const billRun = new BillRun(payload)

    // validate the payload
    // const validData = schema.validateBillRun(payload)

    // const validData = schema.validateTransaction(payload)

    // if (validData.error) {
      // get the better formatted message(s)
      // const msg = validData.error.details.map(e => e.message).join(', ')

      // return HTTP 422
      // return Boom.badData(msg)
    // }

    // Execute the bill run
    // const summary = await RunBilling.call(regime, schema, validData)

    // create the transaction
    // const tId = await AddTransaction.call(regime, schema, validData)
    // const result = {
    //   transaction: {
    //     id: tId
    //   }
    // }

    // return HTTP 201 Created
    const summary = billRun.filter
    const response = h.response(summary)
    response.code(201)
    // if not a dummy run we could provide a link to the summary
    if (!billRun.draft) {
      response.header('Location', regimeBillRunPath(regime, summary.id))
    }
    return response
  } catch (err) {
    console.log(err.name)
    if (Boom.isBoom(err)) {
      // status 500 squashes error message for some reason
      if (err.output.statusCode === 500) {
        err.output.payload.message = err.message
      }
      return err
    } else if (err.isJoi) {
      console.log('its a validation error!')
      console.log(err.annotate())
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
