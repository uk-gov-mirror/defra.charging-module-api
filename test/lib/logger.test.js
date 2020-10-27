'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code

// Thing under test
const logger = require('../../app/lib/logger')

// Things we need to stub
const config = require('../../config/config')
const Logger = require('../../app/lib/logger')

describe('Logger', () => {
  let loggerSpy

  beforeEach(() => {
    loggerSpy = Sinon.spy(Logger, '_log')
  })

  afterEach(() => {
    Sinon.restore()
  })

  describe("when the environment is not 'test' or 'logInTest' is set to 'true'", () => {
    beforeEach(() => {
      Sinon.replace(config, 'logInTest', true)
    })

    describe("and I call 'trace()'", () => {
      it('calls Pino to log the message', () => {
        logger.trace('Testing 1,2,3')

        expect(loggerSpy.callCount).to.equal(1)
      })
    })

    describe("and I call 'debug()'", () => {
      it('calls Pino to log the message', () => {
        logger.debug('Testing 1,2,3')

        expect(loggerSpy.callCount).to.equal(1)
      })
    })

    describe("and I call 'info()'", () => {
      it('calls Pino to log the message', () => {
        logger.info('Testing 1,2,3')

        expect(loggerSpy.callCount).to.equal(1)
      })
    })

    describe("and I call 'warn()'", () => {
      it('calls Pino to log the message', () => {
        logger.warn('Testing 1,2,3')

        expect(loggerSpy.callCount).to.equal(1)
      })
    })

    describe("and I call 'error()'", () => {
      it('calls Pino to log the message', () => {
        logger.error('Testing 1,2,3')

        expect(loggerSpy.callCount).to.equal(1)
      })
    })
  })

  describe("when the environment is 'test' and  'logInTest' is set to 'false'", () => {
    beforeEach(() => {
      Sinon.replace(config, 'logInTest', false)
    })

    describe("and I call 'trace()'", () => {
      it('does not call Pino to log the message', () => {
        logger.trace('Testing 1,2,3')

        expect(loggerSpy.callCount).to.equal(0)
      })
    })

    describe("and I call 'debug()'", () => {
      it('does not call Pino to log the message', () => {
        logger.debug('Testing 1,2,3')

        expect(loggerSpy.callCount).to.equal(0)
      })
    })

    describe("and I call 'info()'", () => {
      it('does not call Pino to log the message', () => {
        logger.info('Testing 1,2,3')

        expect(loggerSpy.callCount).to.equal(0)
      })
    })

    describe("and I call 'warn()'", () => {
      it('does not call Pino to log the message', () => {
        logger.warn('Testing 1,2,3')

        expect(loggerSpy.callCount).to.equal(0)
      })
    })

    describe("and I call 'error()'", () => {
      it('does not call Pino to log the message', () => {
        logger.error('Testing 1,2,3')

        expect(loggerSpy.callCount).to.equal(0)
      })
    })
  })
})
