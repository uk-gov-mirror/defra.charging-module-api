// search transaction queue
const { pool } = require('../lib/connectors/db')
// const config = require('../../config/config')
// const Schema = require('../schema')

async function call (searchRequest) {
  const promises = [
    searchRequest.totalCount(pool),
    searchRequest.query(pool)
  ]

  const results = await Promise.all(promises)
  const count = results[0]
  const pageTotal = Math.ceil(count / searchRequest.perPage)
  const rows = results[1].rows

  // pagination.pageCount = pageTotal
  // pagination.recordCount = count

  return {
    pagination: {
      page: searchRequest.page,
      perPage: searchRequest.perPage,
      pageCount: pageTotal,
      recordCount: count
    },
    data: {
      transactions: rows
    }
  }
}

module.exports = {
  call
}
