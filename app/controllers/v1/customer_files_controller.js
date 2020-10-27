// Customer Files =====================
const Boom = require('@hapi/boom')
const config = require('../../../config/config')
const Authorisation = require('../../lib/authorisation')
const GenerateCustomerFile = require('../../services/generate_customer_file')
const ExportRegionCustomerFile = require('../../services/export_region_customer_file')
const Schema = require('../../schema/pre_sroc')

const basePath = '/v1/{regime_id}/customer_files'

class CustomerFilesController {
  // GET /v1/{regime_id}/customer_files
  static async index (req, h) {
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
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  // GET /v1/{regime_id}/customer_files{id}
  static async show (req, h) {
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
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  // POST /v1/{regime_id}/customer_files
  static async create (req, h) {
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
        response.header('Location', this.regimeCustomerFilePath(regime, result.id))
      } else {
        response = h.response({ status: 'No customer changes found' })
        response.code(200)
      }

      return response
    } catch (err) {
      req.log(['ERROR'], err.stack)
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

  static regimeCustomerFilePath (regime, customerFileId) {
    return `${config.environment.serviceUrl}/v1/${regime.slug}/customer_files/${customerFileId}`
  }

  static routes () {
    return [
      {
        method: 'GET',
        path: basePath,
        handler: this.index.bind(this)
      },
      {
        method: 'POST',
        path: basePath,
        handler: this.create.bind(this)
      },
      {
        method: 'GET',
        path: `${basePath}/{id}`,
        handler: this.show.bind(this)
      }
    ]
  }
}

module.exports = CustomerFilesController
