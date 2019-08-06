const Boom = require('@hapi/boom')
const regimes = require('../../services/query/regime')
const { logger } = require('../../lib/logger')

const basePath = '/v1/regimes'

function index (req, h) {
  return regimes.all()
    .then(result => {
      console.log(result)
      return {
        pagination: result.pagination,
        data: {
          regimes: result.data.regimes.map(regime => mapRegimeItem(regime))
        }
      }
    }).catch(err => {
      logger.error(err.stack)
      return Boom.boomify(err)
    })
}

function show (req, h) {
  return regimes.findBySlug(req.params.id)
    .then(result => {
      if (result) {
        return {
          data: {
            regime: mapRegimeItem(result)
          }
        }
      } else {
        return Boom.notFound()
      }
    }).catch(err => {
      logger.error(err.stack)
      return Boom.boomify(err)
    })
}

function mapRegimeItem (item) {
  return {
    id: item.slug,
    name: item.name
  }
}

const routes = [
  {
    method: 'GET',
    path: basePath,
    handler: index
  },
  {
    method: 'GET',
    path: basePath + '/{id}',
    handler: show
  }
]

module.exports = {
  routes
}
