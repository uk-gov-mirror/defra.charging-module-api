// Customer Files =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const { logger } = require('../../lib/logger')
const Authorisation = require('../../lib/authorisation')
const GenerateCustomerFile = require('../../services/generate_customer_file')
const ExportRegionCustomerFile = require('../../services/export_region_customer_file')
const Schema = require('../../schema/pre_sroc')

const basePath = '/v1/{regime_id}/customer_files'

async function index (req, h) {
  try {
    // check regime valid and caller has access to regime
    // regime_id is part of routing so must be defined to get here
    const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

    // load the correct schema for the regime
    const CustomerFile = Schema[regime.slug].CustomerFile

    const { page, perPage, sort, sortDir, ...q } = req.query

    // translate params into DB naming
    const params = q
    // force these criteria
    params.regime_id = regime.id

    // select all customer changes matching search criteria for the regime
    return CustomerFile.search(params, page, perPage, sort, sortDir)
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

async function create (req, h) {
  try {
    const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

    // process and add transaction(s) in payload
    const payload = req.payload
    if (!payload) {
      // return HTTP 400
      return Boom.badRequest('No payload')
    }

    // load the correct schema for the regime
    const schema = Schema[regime.slug]
    const customerFile = await schema.CustomerFile.instanceFromRequest(regime.id, req.payload)

    const result = await GenerateCustomerFile.call(customerFile)
    let response

    if (result.changesCount > 0) {
      // actually generate the file and copy to S3
      await ExportRegionCustomerFile.call(regime, result.region)
      response = h.response(result)
      response.code(201)
      response.header('Location', regimeCustomerFilePath(regime, result.id))
    } else {
      response = h.response({ status: 'No customer changes found' })
      response.code(200)
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

async function show (req, h) {
  try {
    const regime = await Authorisation.assertAuthorisedForRegime(req.params.regime_id, req.headers.authorization)

    const id = req.params.id

    const schema = Schema[regime.slug]
    const customerFile = await schema.CustomerFile.find(regime.id, id)

    if (customerFile === null) {
      return Boom.notFound(`No customer file found with id '${id}'`)
    }

    // load customer change records
    await customerFile.loadChanges()

    return {
      customerFile: customerFile
    }
  } catch (err) {
    logger.error(err.stack)
    return Boom.boomify(err)
  }
}

function regimeCustomerFilePath (regime, customerFileId) {
  return `${config.environment.serviceUrl}/v1/${regime.slug}/customer_files/${customerFileId}`
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
    method: 'GET',
    path: `${basePath}/{id}`,
    handler: show
  }
]

module.exports = {
  routes
}
