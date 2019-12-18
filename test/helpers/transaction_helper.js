const { pool } = require('../../app/lib/connectors/db')
const Sinon = require('sinon')
const RuleService = require('../../app/lib/connectors/rules')
const Schema = require('../../app/schema/pre_sroc')
const AddTransaction = require('../../app/services/add_transaction')
const { dummyCharge } = require('./charge_helper')

// TODO: move to test_utils.js or similar
async function addTransaction (regime, data = {}) {
  const schema = Schema[regime.slug]

  const payload = {
    periodStart: '01-APR-2019',
    periodEnd: '31-MAR-2020',
    credit: false,
    billableDays: 230,
    authorisedDays: 240,
    volume: '3.5865',
    source: 'Supported',
    season: 'Summer',
    loss: 'Low',
    twoPartTariff: false,
    compensationCharge: false,
    eiucSource: 'Tidal',
    waterUndertaker: false,
    regionalChargingArea: 'Anglian',
    section127Agreement: false,
    section130Agreement: false,
    customerReference: 'TH12345678',
    lineDescription: 'Drains within Littleport & Downham IDB',
    licenceNumber: '123/456/26/*S/0453/R01',
    chargePeriod: '01-APR-2018 - 31-MAR-2019',
    chargeElementId: '',
    batchNumber: 'TEST1',
    region: 'A',
    areaCode: 'ARCA'
  }

  const stub = Sinon.stub(RuleService, 'calculateCharge').resolves(dummyCharge())

  // create Transaction object, validate and translate
  const transaction = schema.Transaction.instanceFromRequest(Object.assign(payload, data))

  // add transaction to the queue (create db record)
  const result = await AddTransaction.call(regime, transaction, schema)

  stub.restore()

  return result
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

module.exports = {
  addTransaction,
  updateTransaction,
  cleanTransactions
}
