const Sinon = require('sinon')
const RuleService = require('../../app/lib/connectors/rules')
const Schema = require('../../app/schema/pre_sroc')
const AddTransaction = require('../../app/services/add_transaction')
const { DatabaseHelper } = require('./database_helper')
const { dummyCharge } = require('./charge_helper')
const { StandardTransactionRequest } = require('../fixtures/transaction_requests')
const { StandardTransaction } = require('../fixtures/transactions')

async function createTransaction (regimeId, isCredit, alternateData = {}) {
  const transaction = StandardTransaction(regimeId, isCredit, alternateData)
  const result = await DatabaseHelper.createRecord('transactions', transaction)

  return result.id
}

// TODO: move to test_utils.js or similar
async function addTransaction (regime, data = {}) {
  const schema = Schema[regime.slug]

  const stub = Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge())

  // create Transaction object, validate and translate
  const transaction = buildTransaction(regime, data)

  // add transaction to the queue (create db record)
  const result = await AddTransaction.call(regime, transaction, schema)

  stub.restore()

  return result
}

function buildTransaction (regime, data = {}) {
  const payload = StandardTransactionRequest()
  return (Schema[regime.slug].Transaction).instanceFromRequest(Object.assign(payload, data))
}

async function cleanTransactions () {
  await DatabaseHelper.cleanRecords('transactions')
}

async function updateTransaction (id, params) {
  await DatabaseHelper.updateRecord('transactions', id, params)
}

module.exports = {
  addTransaction,
  buildTransaction,
  cleanTransactions,
  createTransaction,
  updateTransaction
}
