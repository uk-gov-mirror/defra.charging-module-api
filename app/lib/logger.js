const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf } = format
const config = require('../../config/config')

const myFormat = printf(({ level, message, timestamp, service }) => {
  return `${timestamp} ${service} [${level}]: ${message}`
})

const logger = createLogger({
  level: 'info',
  defaultMeta: { service: 'charging-module-api' },
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new transports.Console({
      level: 'info',
      silent: config.environment.test
    })
  ]
})

module.exports.logger = logger
