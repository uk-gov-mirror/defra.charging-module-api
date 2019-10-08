// manage datamaps
const { pool } = require('../lib/connectors/db')

const DEFAULT_TRANSACTION_MAP = {
  sequence_number: 'sequence_number',
  customer_reference: 'customer_reference',
  transaction_date: 'transaction_date',
  transaction_type: 'transaction_type',
  transaction_reference: 'transaction_reference',
  related_reference: 'related_reference',
  currency_code: 'currency_code',
  header_narrative: 'header_narrative',
  header_attr_1: 'header_attr_1',
  header_attr_2: 'header_attr_2',
  header_attr_3: 'header_attr_3',
  header_attr_4: 'header_attr_4',
  header_attr_5: 'header_attr_5',
  header_attr_6: 'header_attr_6',
  header_attr_7: 'header_attr_7',
  header_attr_8: 'header_attr_8',
  header_attr_9: 'header_attr_9',
  header_attr_10: 'header_attr_10',
  currency_line_amount: 'currency_line_amount',
  line_vat_code: 'line_vat_code',
  line_area_code: 'line_area_code',
  line_description: 'line_description',
  line_income_stream_code: 'line_income_stream_code',
  line_context_code: 'line_context_code',
  line_attr_1: 'line_attr_1',
  line_attr_2: 'line_attr_2',
  line_attr_3: 'line_attr_3',
  line_attr_4: 'line_attr_4',
  line_attr_5: 'line_attr_5',
  line_attr_6: 'line_attr_6',
  line_attr_7: 'line_attr_7',
  line_attr_8: 'line_attr_8',
  line_attr_9: 'line_attr_9',
  line_attr_10: 'line_attr_10',
  line_attr_11: 'line_attr_11',
  line_attr_12: 'line_attr_12',
  line_attr_13: 'line_attr_13',
  line_attr_14: 'line_attr_14',
  line_attr_15: 'line_attr_15',
  line_quantity: 'line_quantity',
  unit_of_measure: 'unit_of_measure',
  unit_of_measure_price: 'unit_of_measure_price',
  region: 'region',
  pre_sroc: 'pre_sroc',
  approved_for_billing: 'approved_for_billing',
  approved_for_billing_at: 'approved_for_billing_at',
  charge_period_start: 'charge_period_start',
  charge_period_end: 'charge_period_end',
  charge_calculation: 'charge_calculation',
  charge_financial_year: 'charge_financial_year',
  charge_credit: 'charge_credit',
  regime_value_1: 'regime_value_1',
  regime_value_2: 'regime_value_2',
  regime_value_3: 'regime_value_3',
  regime_value_4: 'regime_value_4',
  regime_value_5: 'regime_value_5',
  regime_value_6: 'regime_value_6',
  regime_value_7: 'regime_value_7',
  regime_value_8: 'regime_value_8',
  regime_value_9: 'regime_value_9',
  regime_value_10: 'regime_value_10',
  regime_value_11: 'regime_value_11',
  regime_value_12: 'regime_value_12',
  regime_value_13: 'regime_value_13',
  regime_value_14: 'regime_value_14',
  regime_value_15: 'regime_value_15'
}

async function regimesWithoutMap (mapType) {
  const stmt = 'select r.id from regimes r left outer join data_maps dm on (dm.regime_id = r.id) where r.id not in (select regime_id from data_maps where map_type = $1)'
  const result = await pool.query(stmt, [mapType])

  return result.rows.map(r => r.id)
}

async function getRegimeMap (regimeId, mapType) {
  const stmt = 'SELECT data_map FROM data_maps WHERE regime_id = $1 AND map_type = $2'
  const result = await pool.query(stmt, [regimeId, mapType])

  if (result && result.rows[0]) {
    return result.rows[0].data_map
  }

  // TODO: Replace this with seeds once the mechanism is sorted out
  return DEFAULT_TRANSACTION_MAP
  // throw new Error(`No '${mapType}' data map found for regime '${regimeId}'`)
}

async function seedTransactionMaps () {
  const client = await pool.connect()
  const jsonMap = DEFAULT_TRANSACTION_MAP

  try {
    let regimes = await regimesWithoutMap('transaction')
    // find regimes without a transaction data_map
    for (let n = 0; n < regimes.length; n++) {
      await client.query('insert into data_maps (regime_id, map_type, data_map) values ($1, $2, $3)',
        [regimes[n], 'transaction', jsonMap])
    }

    regimes = await regimesWithoutMap('sroc_transaction')
    for (let n = 0; n < regimes.length; n++) {
      await client.query('insert into data_maps (regime_id, map_type, data_map) values ($1, $2, $3)',
        [regimes[n], 'sroc_transaction', jsonMap])
    }

    return true
  } finally {
    client.release()
  }
}

function regimeTransactionMap (regimeId) {
  return getRegimeMap(regimeId, 'transaction')
}

function regimeSrocTransactionMap (regimeId) {
  return getRegimeMap(regimeId, 'sroc_transaction')
}

module.exports = {
  seedTransactionMaps,
  regimeTransactionMap,
  regimeSrocTransactionMap
}
