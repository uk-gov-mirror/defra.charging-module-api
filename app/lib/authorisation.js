// Security and authorisation placeholder
const Boom = require('@hapi/boom')
const jwt = require('jsonwebtoken')
const Regime = require('../models/regime')
const config = require('../../config/config')
const { pool } = require('./connectors/db')
const logger = require('../lib/logger')

class Authorisation {
  static async assertAuthorisedForRegime (slug, token) {
    const clientId = this.clientIdFromToken(token)
    if (!clientId) {
      throw Boom.unauthorized('Invalid token')
    }

    const regime = await Regime.find(slug)

    if (!regime) {
      throw Boom.notFound(`Regime '${slug}' not found`)
    }

    const permitted = await this.isClientAuthorisedForRegime(regime.id, clientId)

    if (!permitted) {
      throw Boom.forbidden(`Unauthorised for regime '${slug}'`)
    }

    return regime
  }

  static assertAdminOnlyAccess (token) {
    const clientId = this.clientIdFromToken(token)
    if (!clientId) {
      throw Boom.unauthorized('Invalid token')
    }

    if (clientId !== config.adminClientId) {
      throw Boom.forbidden('Insufficient privileges')
    }
    return true
  }

  static async isClientAuthorisedForRegime (regimeId, clientId) {
    if (clientId === config.adminClientId) {
      // admin can access anything
      logger.info('*** Admin client authorised ***')
      return true
    } else {
      // check
      const stmt = `
        UPDATE regime_authorisations
        SET last_accessed_at=NOW()
        FROM authorised_systems
        WHERE regime_id=$1::uuid
        AND authorised_system_id=$2
        AND status='active'
      `
      const result = await pool.query(stmt, [regimeId, clientId])
      return result.rowCount === 1
    }
  }

  static clientIdFromToken (token) {
    if (token) {
      let actualToken = token
      const found = token.match(/^bearer\s+(.*)$/i)
      if (found) {
        actualToken = found[1]
      }
      const decodedToken = jwt.decode(actualToken, { complete: true })
      if (decodedToken) {
        return decodedToken.payload.client_id
      }
    }
    return null
  }
}

module.exports = Authorisation
