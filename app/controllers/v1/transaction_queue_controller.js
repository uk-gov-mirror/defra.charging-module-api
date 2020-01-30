// Pre-SRoC Transaction Queue =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const { logger } = require('../../lib/logger')
const SecurityCheckRegime = require('../../services/security_check_regime')
const AddTransaction = require('../../services/add_transaction')
const RemoveTransaction = require('../../services/remove_transaction')
const Schema = require('../../schema/pre_sroc')
const BulkApproval = require('../../services/bulk_approval')
const BulkUnapproval = require('../../services/bulk_unapproval')
const BulkRemoval = require('../../services/bulk_removal')

const basePath = '/v1/{regime_id}/transaction_queue'

async function index (req, h) {
  try {
    // check regime valid and caller has access to regime
    // regime_id is part of routing so must be defined to get here
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    // load the correct schema for the regime
    const Transaction = Schema[regime.slug].Transaction

    const { page, perPage, sort, sortDir, ...q } = req.query

    // translate params into DB naming
    const params = Transaction.translate(q)
    // force these criteria
    params.status = 'unbilled'
    params.regime_id = regime.id
    params.pre_sroc = 'true'

    // select all transactions matching search criteria for the regime (pre-sroc only)
    return Transaction.search(params, page, perPage, sort, sortDir)
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

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

    // create Transaction object, validate and translate
    const transaction = schema.Transaction.instanceFromRequest(payload)

    // add transaction to the queue (create db record)
    const tId = await AddTransaction.call(regime, transaction, schema)
    const result = {
      transaction: {
        id: tId
      }
    }

    // return HTTP 201 Created
    const response = h.response(result)
    response.code(201)
    response.header('Location', regimeTransactionPath(regime, tId))
    return response
  } catch (err) {
    if (Boom.isBoom(err)) {
      // status 500 squashes error message for some reason
      if (err.output.statusCode === 500) {
        err.output.payload.message = err.message
      }
      return err
    } else {
      return Boom.boomify(err)
    }
  }
}

async function bulkApprove (req, h) {
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    const payload = req.payload
    if (!payload) {
      // return HTTP 400
      return Boom.badRequest('No payload')
    }

    // load the correct schema for the regime
    const schema = Schema[regime.slug]

    // validate and translate request payload
    const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)

    const summary = await BulkApproval.call(approvalRequest)

    // return HTTP 200
    return h.response(summary).code(200)
  } catch (err) {
    if (Boom.isBoom(err)) {
      // status 500 squashes error message for some reason
      if (err.output.statusCode === 500) {
        err.output.payload.message = err.message
      }
      return err
    } else {
      return Boom.boomify(err)
    }
  }
}

async function bulkUnapprove (req, h) {
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    const payload = req.payload
    if (!payload) {
      // return HTTP 400
      return Boom.badRequest('No payload')
    }

    // load the correct schema for the regime
    const schema = Schema[regime.slug]

    // validate and translate request payload
    const approvalRequest = await schema.ApprovalRequest.instanceFromRequest(regime.id, payload)

    const summary = await BulkUnapproval.call(approvalRequest)

    // return HTTP 200
    return h.response(summary).code(200)
  } catch (err) {
    if (Boom.isBoom(err)) {
      // status 500 squashes error message for some reason
      if (err.output.statusCode === 500) {
        err.output.payload.message = err.message
      }
      return err
    } else {
      return Boom.boomify(err)
    }
  }
}

async function bulkRemove (req, h) {
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    const payload = req.payload
    if (!payload) {
      // return HTTP 400
      return Boom.badRequest('No payload')
    }

    // load the correct schema for the regime
    const schema = Schema[regime.slug]

    // validate and translate request payload
    const removalRequest = await schema.RemovalRequest.instanceFromRequest(regime.id, payload)

    const summary = await BulkRemoval.call(removalRequest)

    // return HTTP 200
    return h.response(summary).code(200)
  } catch (err) {
    if (Boom.isBoom(err)) {
      // status 500 squashes error message for some reason
      if (err.output.statusCode === 500) {
        err.output.payload.message = err.message
      }
      return err
    } else {
      return Boom.boomify(err)
    }
  }
}

async function remove (req, h) {
  // remove (delete) transaction
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)
    await RemoveTransaction.call(regime, req.params.id)

    // HTTP 204 No Content
    return h.response().code(204)
  } catch (err) {
    return Boom.boomify(err)
  }
}

function regimeTransactionPath (regime, transactionId) {
  return `${config.environment.serviceUrl}/v1/${regime.slug}/transactions/${transactionId}`
}

const routes = [
  {
    method: 'GET',
    path: basePath,
    handler: index
  },
  {
    method: 'POST',
    path: basePath,
    handler: create
  },
  {
    method: 'PATCH',
    path: `${basePath}/approve`,
    handler: bulkApprove
  },
  {
    method: 'PATCH',
    path: `${basePath}/unapprove`,
    handler: bulkUnapprove
  },
  {
    method: 'POST',
    path: `${basePath}/remove`,
    handler: bulkRemove
  },
  {
    method: 'DELETE',
    path: `${basePath}/{id}`,
    handler: remove
  }
]

module.exports = {
  routes
}
