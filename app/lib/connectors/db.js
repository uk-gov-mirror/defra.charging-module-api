const { Pool } = require('pg')
const { logger } = require('../logger')
const config = require('../../../config/config')

const pool = new Pool(config.db)

pool.on('acquire', client => {
  const { totalCount, idleCount, waitingCount } = pool
  if (config.db.max && config.db.max === totalCount) {
    logger.warn(`Connection Pool => Total: ${totalCount}, Idle: ${idleCount}, Waiting: ${waitingCount}`)
  }
})

pool.on('connect', client => {
  client.query("SET SCHEMA 'charging'")
    .catch(err => logger.error(err.stack))
})

exports.pool = pool
