'use strict'

const { pool } = require('../../app/lib/connectors/db')

class DatabaseHelper {
  static async cleanRecords (tablename) {
    // When you wish to empty a table TRUNCATE is prefered over DELETE. TRUNCATE will remove everything in one go
    // without the need to scan them. It also reclaims the storage immediately, unlike DELETE which will require
    // the VACUMM operation. We also restart any identities to return to a 'true' fresh state.
    // CASCADE handles any foreign key constraints. This means any linked tables will also be truncated and have their
    // identities restarted. Not something you would run in production, but ideal in testing
    const result = await pool.query(`TRUNCATE TABLE ${tablename} RESTART IDENTITY CASCADE`)
    return result
  }

  static async createRecord (tablename, data) {
    const names = []
    const params = []
    const values = []
    let attrCount = 1

    Object.keys(data).forEach((k) => {
      names.push(k)
      params.push(`$${attrCount++}`)
      values.push(data[k])
    })

    const stmt = `INSERT INTO ${tablename} (${names.join(',')}) VALUES (${params.join(',')}) RETURNING id`
    const result = await pool.query(stmt, values)

    return result.rows[0]
  }

  static async findRecord (tablename, id) {
    const result = await pool.query(`SELECT * FROM ${tablename} WHERE id = '${id}'`)

    return result.rows[0]
  }

  static async updateRecord (tablename, id, data) {
    const keys = []
    const vals = []
    let n = 1

    Object.keys(data).forEach(k => {
      keys.push(`${k}=$${n++}`)
      vals.push(data[k])
    })

    const stmt = `UPDATE ${tablename} SET ${keys.join(',')} WHERE id='${id}'::uuid`
    const result = await pool.query(stmt, vals)

    return result.rows[0]
  }
}

module.exports = {
  DatabaseHelper,
  pool
}
