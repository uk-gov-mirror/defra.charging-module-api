'use strict'

/**
 * Plugin that handles logging for the application
 *
 * {@link https://github.com/pinojs/hapi-pino|hapi-pino} wraps the
 * {@link https://github.com/pinojs/pino#low-overhead|pino} Node JSON logger as a logger for Hapi. We pretty much use it
 * as provided with its defaults.
 *
 * @module HapiPinoPlugin
 */
const HapiPino = require('hapi-pino')

/**
 * Return test configuration options for the logger
 *
 * When we run our unit tests we don't want the output polluted by noise from the logger. So as a default we set the
 * configuration to tell hapi-pino to ignore all events.
 *
 * But there will be times when trying to diagnose an issue that we will want log output. So using an env var we can
 * override the default and tell hapi-pino to log everything as normal.
 *
 * In both cases using the
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax|spread operator} on
 * the returned value will allow it to be incorporated with our default hapi-pino options.
 */
const testOptions = logInTest => {
  if (process.env.NODE_ENV !== 'test' || logInTest) {
    return {}
  }
  const tags = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']
  return {
    // Don't log requests etc
    logEvents: false,
    // Don't log anything tagged with DEBUG or info, for example, req.log(['INFO'], 'User is an admin')
    ignoredEventTags: { log: tags, request: tags }
  }
}

const HapiPinoPlugin = logInTest => {
  return {
    plugin: HapiPino,
    options: {
      // Include our test configuration
      ...testOptions(logInTest),
      // When not in the production environment we want a 'pretty' version of the JSON to make it easier to grok what has
      // happened
      prettyPrint: process.env.NODE_ENV !== 'production',
      // Redact Authorization headers, see https://getpino.io/#/docs/redaction
      redact: ['req.headers.authorization'],
      // We don't want logs outputting for our 'health' routes
      ignorePaths: ['/', '/status']
    }
  }
}

module.exports = HapiPinoPlugin
