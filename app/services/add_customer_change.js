const { pool } = require('../lib/connectors/db')

// Add a new or update an existing customer change record
async function call (regime, customerChange) {
  // check if a change is already present for this customer
  const stmt = 'SELECT id FROM customer_changes WHERE regime_id=$1::uuid AND region=$2 AND customer_reference=$3 AND status=\'initialised\''
  const result = await pool.query(stmt, [regime.id, customerChange.region, customerChange.customer_reference])

  if (result.rowCount > 0) {
    // update existing customer change
    return update(result.rows[0].id, customerChange)
  } else {
    // create new customer change
    return create(regime, customerChange)
  }
}

async function update (id, customerChange) {
  const stmt = `
    UPDATE customer_changes
    SET customer_name=$1,
    address_line_1=$2,
    address_line_2=$3,
    address_line_3=$4,
    address_line_4=$5,
    address_line_5=$6,
    address_line_6=$7,
    postcode=$8
    WHERE id=$9::uuid
  `
  const values = [
    customerChange.customer_name,
    customerChange.address_line_1,
    customerChange.address_line_2,
    customerChange.address_line_3,
    customerChange.address_line_4,
    customerChange.address_line_5,
    customerChange.address_line_6,
    customerChange.postcode,
    id
  ]
  const result = await pool.query(stmt, values)
  if (result.rowCount === 1) {
    return id
  }
  throw new Error(`Failed to update customer record (${id})`)
}

// Assumes at this point that the attrs are in DB naming scheme
async function create (regime, customerChange) {
  const names = []
  const values = []
  const data = []
  let attrCount = 1

  // add the association with the regime
  customerChange.regime_id = regime.id

  Object.keys(customerChange).forEach((k) => {
    names.push(k)
    values.push(`$${attrCount++}`)
    data.push(customerChange[k])
  })

  const stmt = `INSERT INTO customer_changes (${names.join(',')}) VALUES (${values.join(',')}) RETURNING id`
  const result = await pool.query(stmt, data)
  return result.rows[0].id
}

module.exports = {
  call
}
