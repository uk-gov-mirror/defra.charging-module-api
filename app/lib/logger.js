'use strict'

const Pino = require('pino')()
const config = require('../../config/config')

class Logger {
  static trace (data) {
    if (this._enabled()) {
      this._log('trace', data)
    }
  }

  static debug (data) {
    if (this._enabled()) {
      this._log('debug', data)
    }
  }

  static info (data) {
    if (this._enabled()) {
      this._log('info', data)
    }
  }

  static warn (data) {
    if (this._enabled()) {
      this._log('warn', data)
    }
  }

  static error (data) {
    if (this._enabled()) {
      this._log('error', data)
    }
  }

  static _log (level, data) {
    Pino[level](data)
  }

  static _enabled () {
    return (process.env.NODE_ENV !== 'test' || config.logInTest)
  }
}

module.exports = Logger
