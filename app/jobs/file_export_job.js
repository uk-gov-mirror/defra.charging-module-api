// expecting to be called via cron

// look for any bill runs that need to be exported into transaction files
// if found, update status and hand off to GenerateTransactionFile service
const DBTransaction = require('../lib/db_transaction')
const Schema = require('../schema')
const BillRun = require('../models/bill_run')
const Regime = require('../models/regime')
const GenerateTransactionFile = require('../services/generate_transaction_file')
const MoveBillRunToS3 = require('../services/move_bill_run_to_s3')
const { logger } = require('../lib/logger')

// function run () {
//   return exportFile().then(res => { return logger.info(res) }).catch(err => { logger.error(err) })
// }

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
       LIMIT 1)
       RETURNING id,regime_id`
    )

    if (result.rowCount === 1) {
      const id = result.rows[0].id
      const regimeId = result.rows[0].regime_id

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
      const presenter = new (scheme[regime.slug].TransactionFilePresenter)(br)
      await GenerateTransactionFile.call(db, presenter)
      // copy transaction file to S3
      await MoveBillRunToS3.call(br)

      // if success update bill run status
      await br.billed(db)
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
