const Boom = require('@hapi/boom')
// const Transaction = require('../../models/transaction')
const { logger } = require('../../lib/logger')
const SecurityCheckRegime = require('../../services/security_check_regime')
const ApproveTransaction = require('../../services/approve_transaction')
const UnapproveTransaction = require('../../services/unapprove_transaction')
const RemoveTransaction = require('../../services/remove_transaction')
const FindTransaction = require('../../services/find_transaction')

const basePath = '/v1/{regime_id}/transactions'

// TODO: future search/list of all transactions possibly
// async function index (req, h) {
//   // check regime valid
//   // select all transactions matching search criteria for the regime
//   try {
//     const regime = await SecurityCheckRegime.call(req.params.regime_id)

//     return Transaction.findByRegime(regime.id, req.params)
//       .then(result => {
//         return {
//           pagination: result.pagination,
//           data: {
//             transactions: result.data.transactions
//           }
//         }
//       })
//   } catch (err) {
//     logger.error(err.stack)
//     return Boom.boomify(err)
//   }
// }

//
// GET /v1/{regime_id}/transactions/{id}
//
async function show (req, h) {
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    const id = req.params.id
    const transaction = await FindTransaction.call(regime, id)

    if (transaction === null) {
      return Boom.notFound(`No transaction found with id '${id}'`)
    }

    return {
      transaction: transaction
    }
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

//
// DELETE /v1/{regime_id}/transactions/{id}
//
async function remove (req, h) {
  // remove (delete) transaction
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)
    await RemoveTransaction.call(regime, req.params.id)

    // HTTP 204 No Content
    return h.response().code(204)
  } catch (err) {
    console.log(err)
    return Boom.boomify(err)
  }
}

//
// PATCH /v1/{regime_id}/transactions/{id}/approve
//
async function approve (req, h) {
  // approve transaction for billing
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    await ApproveTransaction.call(regime, req.params.id)

    // HTTP 204 No Content
    return h.response().code(204)
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

//
// PATCH /v1/{regime_id}/transactions/{id}/unapprove
//
async function unapprove (req, h) {
  // unapprove/withhold transaction for billing
  try {
    const regime = await SecurityCheckRegime.call(req.params.regime_id)

    await UnapproveTransaction.call(regime, req.params.id)

    // HTTP 204 No Content
    return h.response().code(204)
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

const routes = [
  // {
  //   method: 'GET',
  //   path: basePath,
  //   handler: index
  // },
  {
    method: 'GET',
    path: basePath + '/{id}',
    handler: show
  },
  {
    method: 'PATCH',
    path: basePath + '/{id}/approve',
    handler: approve
  },
  {
    method: 'PATCH',
    path: basePath + '/{id}/unapprove',
    handler: unapprove
  },
  {
    method: 'DELETE',
    path: basePath + '/{id}',
    handler: remove
  }
]

module.exports = {
  routes
}
