'use strict'

const SequenceCounter = require('../../app/models/sequence_counter')

async function InitialisedBillRun (regimeId, region, alternateData = {}) {
  const billRunNumber = await generateBillRunNumber(regimeId, region)

  const fixture = {
    regime_id: regimeId,
    region: region,
    bill_run_number: billRunNumber,
    status: 'initialised',
    pre_sroc: true,
    approved_for_billing: false
  }

  return Object.assign(fixture, alternateData)
}

async function generateBillRunNumber (regimeId, region) {
  const sequenceCounter = new SequenceCounter(regimeId, region)
  const billRunNumber = await sequenceCounter.nextBillRunNumber()

  return billRunNumber
}

module.exports = {
  InitialisedBillRun
}
