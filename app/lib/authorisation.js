// Security and authorisation placeholder
const Boom = require('@hapi/boom')
const jwt = require('jsonwebtoken')
const Regime = require('../models/regime')
const config = require('../../config/config')
const { pool } = require('./connectors/db')
const { logger } = require('./logger')

async function checkAuthorisedForRegime (slug, token) {
  const regime = await Regime.find(slug)

  if (!regime) {
    throw Boom.notFound(`Regime '${slug}' not found`)
  }

  // const testToken = 'eyJraWQiOiJIRlNQSmlPUkhJWmtKUEdjakVMMkErSHZoQ1FGUDQ1V3gwVzkybmdEczhVPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI1MzM1bDdxc284OTNrbGlvMnYwbjhvMHMwMSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiY2hhcmdpbmctbW9kdWxlLWFwaS1kZXZcL3YxIiwiYXV0aF90aW1lIjoxNTg3Mzc1MDI4LCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV9BZFhCNlpZaXIiLCJleHAiOjE1ODczNzg2MjgsImlhdCI6MTU4NzM3NTAyOCwidmVyc2lvbiI6MiwianRpIjoiY2NlYTdmN2UtYmY2Zi00MjEzLTgzMzQtZDg4MThkNGM3OWI1IiwiY2xpZW50X2lkIjoiNTMzNWw3cXNvODkza2xpbzJ2MG44bzBzMDEifQ.F_LrgKANw6Rems0FaFfs7nkZfqivGYHLhqK1sZ7hXaiQoxDui8H4VlKM0c1sw4-KBnB9RzbzgeqluHixfwz0EQsaGa0S-cJCXm1BZNWNZuwHEAPl4adQl1UruKt2-tN2XttBF81eNemnDjmqGeTffP0ahUUqRWLKcMv05WeV9ziOuXA7Zv0_2eIpHoCPZKSeR1rjpywLewYyImirpmLT8EzhhhTjrET-xWQplBfAzipTJL2e6Grw35oBxhKt-7mvnZFm9uinAXwarNX_W0zXAsc_TxwR2ufETUGhrA7-LmFMrp23OeyX9zTrKmbhBZxLVfXvxvZCaRPHCc4dm1Xz3Q'
  const permitted = await isAuthorisedRegime(regime.id, token)

  if (!permitted) {
    throw Boom.forbidden(`Unauthorised for regime '${slug}'`)
  }

  return regime
}

async function isAuthorisedRegime (regimeId, token) {
  const clientId = clientIdFromToken(token)
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

function clientIdFromToken (token) {
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
  throw Boom.unauthorized('Invalid token')
}

function checkAdminOnlyAccess (token) {
  const clientId = clientIdFromToken(token)
  if (clientId !== config.adminClientId) {
    throw Boom.forbidden('Insufficient privileges')
  }
  return true
}

module.exports = {
  checkAuthorisedForRegime,
  checkAdminOnlyAccess
}
