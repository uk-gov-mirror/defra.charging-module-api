const jwt = require('jsonwebtoken')
const AuthorisedSystem = require('../../app/models/authorised_system')
const { pool } = require('../../app/lib/connectors/db')
const config = require('../../config/config')

function createToken (clientId) {
  return jwt.sign({ client_id: clientId }, 'supersecretkey')
}

function createAdminToken () {
  return createToken(config.adminClientId)
}

async function addAuthorisedSystem (clientId, regimeList) {
  await AuthorisedSystem.add({
    id: clientId,
    name: 'test system',
    authorisations: regimeList
  })
}

async function cleanAuthorisedSystems () {
  return pool.query(`DELETE FROM authorised_systems`)
}

module.exports = {
  createToken,
  createAdminToken,
  addAuthorisedSystem,
  cleanAuthorisedSystems
}
