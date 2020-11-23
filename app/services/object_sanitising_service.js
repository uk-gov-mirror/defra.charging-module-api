'use strict'

/**
 * @module ObjectSanitisingService
 */

const Sanitizer = require('sanitizer')

/**
 * Loop through an object's properties and 'sanitise' it.
 *
 * When a request payload comes in there are a number of things we want to do to it's values
 *
 * - handle anything malicious
 * - protect non-string values like booleans and numbers
 *
 * By doing this we protect our service from XSS attacks whilst still ensuring the request gets through to our
 * endpoints
 *
 * For example, suppose the payload request was like this
 *
 * ```
 * {
 *   reference: 'BESESAME001',
 *   codes: ['AB1', 'BD2', 'CD3'],
 *   summary: '',
 *   description: '<script>alert()</script>',
 *   preferences: [true, false, true],
 *   details: {
 *     active: false,
 *     orders: [
 *       {
 *         id: '123',
 *         orderDate: '2012-04-23T18:25:43.511Z',
 *         lines: [
 *           { pos: 1, picked: true, item: 'widget & fidget' },
 *           { pos: 2, picked: false, item: 'widget <PRO>' }
 *         ]
 *       }
 *     ]
 *   }
 * }
 * ```
 *
 * It contains some malicious script (a problem if you inadvertently passed it to a browser to render). It also contains
 * some characters that would be sanitised for rendering in a browser, for example &, < and >. We want the malicious
 * script removed but we want the characters to come through as is. This service will ensure the object hits the
 * endpoint as
 *
 * ```
 * {
 *   reference: 'BESESAME001',
 *   codes: ['AB1', 'BD2', 'CD3'],
 *   summary: '',
 *   description: '',
 *   preferences: [true, false, true],
 *   details: {
 *     active: false,
 *     orders: [
 *       {
 *         id: '123',
 *         orderDate: '2012-04-23T18:25:43.511Z',
 *         lines: [
 *           { pos: 1, picked: true, item: 'widget & fidget' },
 *           { pos: 2, picked: false, item: 'widget <PRO>' }
 *         ]
 *       }
 *     ]
 *   }
 * }
 * ```
 */
class ObjectSanitisingService {
  static go (obj) {
    return this._sanitiseObject(obj)
  }

  /**
   * Loop through an `Object` and sanitise each of its properties.
   *
   * We start by getting the keys for the selected object and then iterate through them. We use the keys to pull out the
   * value for each property. Based on the value's type we
   *
   * - call this method again (recursion) if it's another `Object` passing it the value
   * - call `sanitiseArray()` if an `Array` passing it the value
   * - pass the value to `sanitiseValue()`
   *
   * We store the result in a new 'sanitised' object which is returned when everything has been gone through.
   *
   * @param {Object} obj The object you wish to loop through and sanitise
   * @returns {Object} The 'sanitised' object
   */
  static _sanitiseObject (obj) {
    if (obj === null) {
      return null
    }

    const sanitisedObj = {}

    for (const [key, value] of Object.entries(obj)) {
      let result
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          result = this._sanitiseArray(value)
        } else {
          result = this._sanitiseObject(value)
        }
      } else {
        result = this._sanitiseValue(value)
      }

      sanitisedObj[key] = result
    }

    return sanitisedObj
  }

  /**
   * Loop through an `Array` and sanitise each value
   *
   * This works in a similar way to `sanitiseObj()` only we iterate over the array directly.
   *
   * For each value in the array we check its type. We then
   *
   * - call this `sanitiseObj()` (recursion) if it's another `Object` passing it the value
   * - pass the value to `sanitiseValue()`
   *
   * We store the result in a new 'sanitised' array which is returned when everything has been gone through.
   *
   * @param {Array} array The array you wish to loop through and sanitise
   * @returns {Array} The 'sanitised' array
   */
  static _sanitiseArray (array) {
    const sanitisedArray = []

    for (const item of array) {
      let result

      if (typeof item === 'object') {
        result = this._sanitiseObject(item)
      } else {
        result = this._sanitiseValue(item)
      }

      sanitisedArray.push(result)
    }

    return sanitisedArray
  }

  /**
   * Sanitise a value from the object
   *
   * If the value is a `String` we perform a number of actions before returning it.
   *
   * - sanitize the value to remove anything potentially dangerous
   * - if sanitizing the value escaped any characters, for example `>` as `&gt;`, we want to revert that change back
   *
   * Else we just return the value as is.
   *
   * @param value Value to be sanitised
   * @returns The 'sanitised' value if a `String` else the original value
   */
  static _sanitiseValue (value) {
    if (typeof value === 'string') {
      let sanitisedValue = Sanitizer.sanitize(value)
      sanitisedValue = Sanitizer.unescapeEntities(sanitisedValue)
      return sanitisedValue
    }
    return value
  }
}

module.exports = ObjectSanitisingService
