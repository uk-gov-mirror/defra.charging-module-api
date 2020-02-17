// expecting to be called via cron

// look for any bill runs that need to be exported into transaction files
// if found, update status and hand off to GenerateTransactionFile service
const DBTransaction = require('../lib/db_transaction')
const Schema = require('../schema')
const BillRun = require('../models/bill_run')
const Regime = require('../models/regime')
const GenerateRegionCustomerFile = require('../services/generate_region_customer_file')
const ExportRegionCustomerFile = require('../services/export_region_customer_file')
const CreateFile = require('../services/create_file')
const MoveFileToS3 = require('../services/move_file_to_s3')
const { logger } = require('../lib/logger')

async function run () {
  logger.info('file-export-job - checking for work ...')
  const db = new DBTransaction()

  try {
    await db.begin()

    // grab the oldest bill run that needs to be worked on
    const result = await db.query(
      `UPDATE bill_runs SET status='exporting'
       WHERE id IN (
       SELECT id FROM bill_runs
       WHERE status='unbilled'
       ORDER BY updated_at ASC
       )
       RETURNING id,regime_id`
    )

    await db.savepoint('export')

    for (let n = 0; n < result.rowCount; n++) {
      const savepoint = `export_${n}`
      try {
        await db.savepoint(savepoint)

        const id = result.rows[n].id
        const regimeId = result.rows[n].regime_id

        const regime = await Regime.findById(regimeId)
        if (!regime) {
          throw new Error(`Cannot find regime with id: ${regimeId}`)
        }

        const billRun = await BillRun.find(db, regimeId, id)
        if (!billRun) {
          throw new Error(`Cannot find BillRun with id: ${id}`)
        }
        // get the correct presenter for the regime
        // we need the regime and preSroc status
        const scheme = billRun.pre_sroc ? Schema.preSroc : Schema.sroc
        const br = new (scheme[regime.slug].BillRun)()
        Object.assign(br, billRun)
        logger.info(`Generating transaction file '${br.filename}' for ${regime.slug.toUpperCase()}`)

        // check if any customer changes are waiting to be exported for this region
        await GenerateRegionCustomerFile.call(regime, br.region)
        // check for any awaiting customer files for the region and export
        await ExportRegionCustomerFile.call(regime, br.region)

        const presenter = new (scheme[regime.slug].TransactionFilePresenter)(br)
        await CreateFile.call(db, presenter)
        // copy transaction file to S3
        await MoveFileToS3.call(br)

        // if success update bill run status
        await br.billed(db)
        await db.releaseSavepoint(savepoint)
      } catch (err) {
        logger.error(err)
        await db.rollbackToSavepoint(savepoint)
      }
    }
    await db.commit()
  } catch (err) {
    await db.rollback()
    throw err
  } finally {
    await db.release()
  }
  logger.info('file-export-job - done')
  return 0
}

module.exports = {
  run
}
