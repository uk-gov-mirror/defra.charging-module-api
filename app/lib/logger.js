const config = require('../../config/config')
const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'charging-module-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
})

if (config.environment.development) {
  logger.add(new winston.transports.Console({ level: 'debug' }))
}

module.exports.logger = logger
