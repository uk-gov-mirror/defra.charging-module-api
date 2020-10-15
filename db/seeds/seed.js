const fs = require('fs')
const path = require('path')
const { pool } = require('../../app/lib/connectors/db')

;(async () => {

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // do stuff here

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
})
