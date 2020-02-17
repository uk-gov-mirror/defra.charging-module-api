const DBTransaction = require('../lib/db_transaction')
const scheme = require('../schema/pre_sroc')
const CustomerFile = require('../models/customer_file')
const CreateFile = require('../services/create_file')
const MoveFileToS3 = require('../services/move_file_to_s3')
const { logger } = require('../lib/logger')

async function call (regime, region) {
  const db = new DBTransaction()

  try {
    await db.begin()

    // grab the oldest bill run that needs to be worked on
    const result = await db.query(
      `UPDATE customer_files SET status='exporting'
       WHERE id IN (
       SELECT id FROM customer_files
       WHERE regime_id=$1
       AND status='initialised'
       AND region=$2
       ORDER BY updated_at ASC
       )
       RETURNING id`,
      [regime.id, region]
    )

    await db.savepoint('region')
    for (let n = 0; n < result.rowCount; n++) {
      const savepoint = `region_${n}`

      try {
        await db.savepoint(savepoint)

        const id = result.rows[n].id
        const customerFile = await CustomerFile.find(regime.id, id, db)
        if (!customerFile) {
          throw new Error(`Cannot find Customer File with id: ${id}`)
        }
        // get the correct presenter for the regime
        // we need the regime and preSroc status
        const regimeFile = new (scheme[regime.slug].CustomerFile)()
        Object.assign(regimeFile, customerFile)
        logger.info(`Generating customer file '${regimeFile.filename}' for ${regime.slug.toUpperCase()}`)
        const presenter = new (scheme[regime.slug].CustomerFilePresenter)(regimeFile)
        await CreateFile.call(db, presenter)
        // copy transaction file to S3
        await MoveFileToS3.call(regimeFile)

        // if success update bill run status
        await regimeFile.setExported(db)
        // clean customer data
        //
        await db.releaseSavepoint(savepoint)
      } catch (err) {
        logger.error(err)
        await db.rollbackToSavepoint(savepoint)
      }
    }
    await db.commit()
  } catch (err) {
    logger.error(err)
    await db.rollback()
    throw err
  } finally {
    await db.release()
  }
  return 0
}

module.exports = {
  call
}
