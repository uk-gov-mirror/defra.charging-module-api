const { pool } = require('../../app/lib/connectors/db')
const Schema = require('../../app/schema/pre_sroc')
const AddCustomerChange = require('../../app/services/add_customer_change')

// TODO: move to test_utils.js or similar
async function addCustomerChange (regime, data = {}) {
  const schema = Schema[regime.slug]

  const payload = {
    region: 'A',
    customerReference: 'AB123456A',
    customerName: 'Jobbie Breakers Ltd',
    addressLine1: '11a Bog Lane',
    addressLine5: 'Big Town',
    addressLine6: 'Trumptonshire',
    postcode: 'BG1 0JB'
  }

  // create CustomerChange object, validate and translate
  const customerChange = schema.CustomerChange.instanceFromRequest(Object.assign(payload, data))

  // add transaction to the queue (create db record)
  return AddCustomerChange.call(regime, customerChange)
}

async function cleanCustomerChanges () {
  return pool.query('DELETE from customer_changes')
}

module.exports = {
  addCustomerChange,
  cleanCustomerChanges
}
