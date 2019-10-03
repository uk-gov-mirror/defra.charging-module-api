const { pool } = require('../../lib/connectors/db')
const config = require('../../../config/config')

// async function foo (slug) {
//   const { rows } = await pool.query('SELECT * FROM regimes WHERE slug=$1', [slug])
//   return rows[0]
// }

function findOne (attr, value) {
  const SQL = `SELECT * FROM transactions WHERE ${attr}=$1`
  return new Promise((resolve, reject) => {
    pool.query(SQL, [value])
      .then(res => {
        if (res.rowCount === 0) {
          resolve(null)
        } else {
          resolve(res.rows[0])
        }
      }).catch(err => {
        reject(err)
      })
  })
}

function findByRegime (regimeId, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = Object.assign(config.pagination, options)
    const offset = (opts.page - 1) * opts.perPage
    const limit = opts.perPage

    const promises = [
      pool.query('SELECT count(*) FROM transactions WHERE regime_id = $1',
        [regimeId]),
      pool.query('SELECT * FROM transactions WHERE regime_id = $1 ORDER BY id ASC OFFSET $2 LIMIT $3',
        [regimeId, offset, limit])
    ]

    Promise.all(promises)
      .then(values => {
        const count = parseInt(values[0].rows[0].count)
        const pageTotal = Math.ceil(count / limit)
        const rows = values[1].rows

        resolve({
          pagination: {
            page: opts.page,
            perPage: opts.perPage,
            pageCount: pageTotal,
            recordCount: count
          },
          data: {
            transactions: rows
          }
        })
      })
      .catch(err => {
        reject(err)
      })
  })
}

function findAll (filter = [], options = {}) {
  return new Promise((resolve, reject) => {
    const opts = Object.assign(config.pagination, options)
    const offset = (opts.page - 1) * opts.perPage
    const limit = opts.perPage

    const promises = [
      pool.query('SELECT count(*) FROM transactions'),
      pool.query('SELECT * FROM transactions ORDER BY id ASC OFFSET $1 LIMIT $2', [offset, limit])
    ]

    Promise.all(promises)
      .then(values => {
        const count = parseInt(values[0].rows[0].count)
        const pageTotal = Math.ceil(count / limit)
        const rows = values[1].rows

        resolve({
          pagination: {
            page: opts.page,
            perPage: opts.perPage,
            pageCount: pageTotal,
            recordCount: count
          },
          data: {
            transactions: rows
          }
        })
      })
      .catch(err => {
        reject(err)
      })
  })
}

module.exports = {
  find: (id) => {
    return findOne('id', id)
  },
  all: findAll,
  findByRegime
}
