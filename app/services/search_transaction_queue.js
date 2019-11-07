// search transaction queue
const { pool } = require('../lib/connectors/db')
const config = require('../../config/config')
// const Schema = require('../schema')

async function call (regime, schema, preSroc, query = {}) {
  const { page, perPage, sort, sortDir, ...q } = query

  const pagination = {
    page: page || config.pagination.page,
    perPage: perPage || config.pagination.perPage
  }

  const offset = (pagination.page - 1) * pagination.perPage
  const limit = pagination.perPage

  // build where clause
  // regime name, database name
  // const transactions = require(`../schema/${regime.slug}_transaction`)
  // const schema = Schema[regime.slug]
  const select = schema.transactionQuery()

  // where clause uses DB names not mapped names
  const where = []
  const values = []
  where.push('regime_id = $1')
  values.push(regime.id)
  // add pre/post Sroc condition
  where.push('pre_sroc = $2')
  values.push(preSroc)

  // start at 3 because regime_id and pre_sroc already items 1 and 2
  let attrCount = 3

  Object.keys(q).forEach(k => {
    const col = schema.ATTRIBUTE_MAP[k]
    if (col) {
      let val = q[k]
      if (val && val.indexOf('*') !== -1) {
        val = val.replace(/\*/g, '%')
        where.push(`${col} like $${attrCount++}`)
      } else {
        where.push(`${col} = $${attrCount++}`)
      }
      values.push(val)
    }
  })

  // filter values: financial year, region
  // search values: any other?
  // pagination: page, per_page
  // /v1/transaction_queue?line_attr_1=123&regime_value_1=21
  // /v1/transaction_queue?fy=1819&region=A&customer_reference=ABC*
  const whr = where.join(' AND ')

  // order clause uses mapped names
  const order = []
  // default sort order for WRLS is customer_reference
  let sortCol = 'customer_reference'
  let sortDirection = 'asc'

  if (sort) {
    const col = schema.ATTRIBUTE_MAP[sort]
    if (col) {
      sortCol = col
    }
  }

  if (sortDir && sortDir.toUpperCase() === 'DESC') {
    sortDirection = 'desc'
  }

  order.push(`${sortCol} ${sortDirection}`)
  if (sortCol.toLowerCase() !== 'customer_reference') {
    order.push(`customer_reference ${sortDirection}`)
  }
  order.push(`created_at ${sortDirection}`)

  const promises = [
    pool.query('SELECT count(*) FROM transactions WHERE ' + whr, values),
    pool.query(select + ' WHERE ' +
      whr + ' ORDER BY ' + order.join(',') + ` OFFSET $${attrCount++} LIMIT $${attrCount++}`,
    [...values, offset, limit])
  ]

  const results = await Promise.all(promises)
  const count = parseInt(results[0].rows[0].count)
  const pageTotal = Math.ceil(count / limit)
  const rows = results[1].rows

  pagination.pageCount = pageTotal
  pagination.recordCount = count

  return {
    pagination,
    data: {
      transactions: rows
    }
  }
}

module.exports = {
  call
}
