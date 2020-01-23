// transaction handler
const { pool } = require('./connectors/db')

class DBTransaction {
  constructor () {
    this.client = null
  }

  get connection () {
    return this.client
  }

  async connect () {
    this.client = await pool.connect()
    return this.client
  }

  async begin () {
    return this._perform('BEGIN')
  }

  async commit () {
    return this._perform('COMMIT')
  }

  async rollback () {
    return this._perform('ROLLBACK')
  }

  async release () {
    if (this.client) {
      await this.client.release()
      this.client = null
    }
    return true
  }

  async query (stmt, values) {
    return this._perform(stmt, values)
  }

  async _perform (stmt, values) {
    if (!this.client) {
      await this.connect()
    }
    // NOTE: We are NOT catching errors here because we won't
    // know how to clean up / rollback etc. specific queries
    // It is the responsibility of the caller to ensure clean up
    // and disconnect if an error is thrown
    return this.client.query(stmt, values)
  }
}

module.exports = DBTransaction
