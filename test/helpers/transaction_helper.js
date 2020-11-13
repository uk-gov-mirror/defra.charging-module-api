const { pool } = require('../../app/lib/connectors/db')
const Sinon = require('sinon')
const RuleService = require('../../app/lib/connectors/rules')
const Schema = require('../../app/schema/pre_sroc')
const AddTransaction = require('../../app/services/add_transaction')
const { dummyCharge } = require('./charge_helper')
const { StandardTransactionRequest } = require('../fixtures/transaction_requests')
const { StandardTransaction } = require('../fixtures/transactions')

async function createTransaction (regimeId, isCredit, alternateData = {}) {
  const transaction = StandardTransaction(regimeId, isCredit, alternateData)

  const names = []
  const values = []
  const data = []
  let attrCount = 1

  Object.keys(transaction).forEach((k) => {
    names.push(k)
    values.push(`$${attrCount++}`)
    data.push(transaction[k])
  })

  const stmt = `INSERT INTO transactions (${names.join(',')}) VALUES (${values.join(',')}) RETURNING id`
  const result = await pool.query(stmt, data)
  return result.rows[0].id
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
  return pool.query('DELETE from transactions')
}

async function updateTransaction (id, params) {
  const keys = []
  const vals = []
  let n = 1
  Object.keys(params).forEach(k => {
    keys.push(`${k}=$${n++}`)
    vals.push(params[k])
  })
  const stmt = `UPDATE transactions SET ${keys.join(',')} WHERE id='${id}'::uuid`
  return pool.query(stmt, vals)
}

async function findTransaction (id) {
  const result = await pool.query(`SELECT * FROM transactions WHERE id = '${id}'`)

  return result.rows[0]
}

module.exports = {
  addTransaction,
  buildTransaction,
  cleanTransactions,
  createTransaction,
  findTransaction,
  updateTransaction
}
