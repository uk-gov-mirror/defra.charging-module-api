const { Pool } = require('pg')
const logger = require('../logger')
const config = require('../../../config/config')

const pool = new Pool(config.db)

pool.on('acquire', client => {
  const { totalCount, idleCount, waitingCount } = pool
  if (config.db.max && config.db.max === totalCount) {
    logger.warn(`Connection Pool => Total: ${totalCount}, Idle: ${idleCount}, Waiting: ${waitingCount}`)
  }
})

exports.pool = pool
