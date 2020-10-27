const Boom = require('@hapi/boom')
const Authorisation = require('../../../lib/authorisation')
const { pool } = require('../../../lib/connectors/db')

class DatabaseController {
  static async index (req, _h) {
    try {
      Authorisation.assertAdminOnlyAccess(req.headers.authorization)

      // pg_stat_user_tables is a view that shows statistics about each table
      // per schema (there's one row per table). It gives you information like
      // the number of sequential scans that PG has performed in the table, how
      // much select/insert operations are done in it and so on.
      //
      // Running this query we not only confirm that we can cannot, but get some
      // useful info as well
      const result = await pool.query('SELECT * FROM pg_stat_user_tables')

      return {
        tableStats: result.rows
      }
    } catch (err) {
      req.log(['ERROR'], err.stack)
      return Boom.boomify(err)
    }
  }

  static routes () {
    return [
      {
        method: 'GET',
        path: '/admin/health/database',
        handler: this.index.bind(this)
      }
    ]
  }
}

module.exports = DatabaseController
