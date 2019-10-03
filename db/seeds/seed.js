const fs = require('fs')
const path = require('path')
const { pool } = require('../../app/lib/connectors/db')

async function seedPreSrocTransactions () {
  const client = await pool.connect()

  try {
    const regime = await client.query("select id from regimes where slug='wrls'")
    const id = regime.rows[0].id

    // read data and populate
    return new Promise(resolve => {
      fs.readFile(path.resolve(__dirname, 'transactions.json'), 'utf8', async function (err, data) {
        if (err) throw err
        const records = JSON.parse(data)
        for (let i = 0; i < records.length; i++) {
          const rec = records[i]
          const attrs = Object.keys(rec)
          const values = []
          for (let n = 0; n < attrs.length; n++) {
            values[n] = rec[attrs[n]]
          }
          const stmt = "insert into transactions (regime_id," + attrs.join(',') +
            ") values ('" + id + "','" + values.join("','") + "')"
          console.log(stmt)
          await client.query(stmt)
        }
        resolve(records)
      })
    })
  } finally {
    client.release()
  }
}

seedPreSrocTransactions()
  .then(() => console.log('done'))
  .catch(err => console.err(err))

return 0
