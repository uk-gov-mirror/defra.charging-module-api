'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

const { describe, it } = exports.lab = Lab.script()
const { expect } = Code

// Test helpers

// Thing under test
const ObjectSanitisingService = require('../../app/services/object_sanitising_service')

describe('Object cleaning service', () => {
  describe('When an object contains boolean values', () => {
    it('leaves them untouched in simple objects', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        existingCustomer: true,
        hasOrders: false
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject).to.equal(dirtyObject)
    })

    it('leaves them untouched in nested objects', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        orderStatus: {
          packed: true,
          shipped: false
        }
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject).to.equal(dirtyObject)
    })

    it('leaves them untouched in arrays', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        preferences: [true, false, true]
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject).to.equal(dirtyObject)
    })

    it('leaves them untouched in objects in arrays', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        orders: [
          { id: 1, picked: true, packed: false },
          { id: 2, picked: true, packed: true }
        ]
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject.orders[0]).to.equal(dirtyObject.orders[0])
    })
  })

  describe('When an object contains number values', () => {
    it('leaves them untouched in simple objects', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        value: 120.3,
        lines: 5
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject).to.equal(dirtyObject)
    })

    it('leaves them untouched in nested objects', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        orderDetails: {
          value: 121.33,
          lines: 6
        }
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject).to.equal(dirtyObject)
    })

    it('leaves them untouched in arrays', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        lineValues: [10.0, 11.54, 2.99]
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject).to.equal(dirtyObject)
    })

    it('leaves them untouched in objects in arrays', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        orderLines: [
          { id: 1, value: 12.53 },
          { id: 2, lastName: 3.54 }
        ]
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject.orderLines[0]).to.equal(dirtyObject.orderLines[0])
    })
  })

  describe('When an object has values that contain characters like &, <, and >', () => {
    it('leaves them untouched in simple objects', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        customerName: 'Bert< & >Ernie'
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject).to.equal(dirtyObject)
    })

    it('leaves them untouched in nested objects', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        details: {
          firstName: 'Bert <',
          lastName: '>Ernie<'
        }
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject).to.equal(dirtyObject)
    })

    it('leaves them untouched in arrays', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        codes: ['A1&', 'B2<', 'C3>']
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject).to.equal(dirtyObject)
    })

    it('leaves them untouched in objects in arrays', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        contacts: [
          { firstName: 'Bert', lastName: '& Ernie' },
          { firstName: 'Big', lastName: 'Bird' }
        ]
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject.contacts[0].lastName).to.equal('& Ernie')
    })
  })

  describe('When an object contains dangerous content', () => {
    it('removes it from simple objects', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        customerName: '<script>alert(1)</script>'
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject.customerName).to.equal('')
    })

    it('removes it from nested objects', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        details: {
          firstName: '<script>alert(1)</script>',
          lastName: 'Ernie'
        }
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject.details.firstName).to.equal('')
    })

    it('removes it from arrays', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        codes: ['ABD1', '<script>alert(1)</script>', 'C2']
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject.codes).to.equal(['ABD1', '', 'C2'])
    })

    it('can remove them from objects in arrays', () => {
      const dirtyObject = {
        reference: 'BESESAME001',
        contacts: [
          { firstName: 'Bert', lastName: '<script>alert(1)</script>' },
          { firstName: 'Big', lastName: 'Bird' }
        ]
      }

      const sanitisedObject = ObjectSanitisingService.go(dirtyObject)
      expect(sanitisedObject.contacts[0].lastName).to.equal('')
    })
  })
})
