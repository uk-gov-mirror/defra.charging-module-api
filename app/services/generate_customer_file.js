const DBTransaction = require('../lib/db_transaction')
const utils = require('../lib/utils')

// generate a new customer file record
async function call (customerFile) {
  // collate the customer changes to be included
  const queryArgs = {
    regime_id: customerFile.regimeId,
    status: 'initialised',
    region: customerFile.region
  }

  const { where, values } = utils.buildWhereClause(queryArgs)
  const db = new DBTransaction()

  try {
    await db.begin()

    const stmt = `SELECT * FROM customer_changes WHERE ${where}`
    const result = await db.query(stmt, values)

    if (result.rowCount > 0) {
      // create a customer file record
      await customerFile.generateFileId()
      await customerFile.save(db)
      customerFile.changesCount = result.rowCount
      // associate customer changes with file and update their status
      const upd = `UPDATE customer_changes SET customer_file_id=$4::uuid, status='exported' WHERE ${where}`
      await db.query(upd, [...values, customerFile.id])
      // load the list of changes associated with this file
      await customerFile.loadChanges(db)
    } else {
      // indicate nothing done
      customerFile.changesCount = 0
    }

    await db.commit()
  } catch (err) {
    await db.rollback()
    throw err
  } finally {
    db.release()
  }

  return customerFile
}

module.exports = {
  call
}
