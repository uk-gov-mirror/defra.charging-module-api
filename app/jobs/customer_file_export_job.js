// expecting to be called (probably weekly) via cron to export any customer changes that
// haven't automatically been exported via the transaction file export

// look for any customer files that need to be exported
// if found, update status and hand off to GenerateTransactionFile service
const GenerateRegionCustomerFile = require('../services/generate_region_customer_file')
const ExportRegionCustomerFile = require('../services/export_region_customer_file')
const Regime = require('../models/regime')
const { logger } = require('../lib/logger')

async function run () {
  logger.info('customer-file-export-job - checking for work ...')

  // TODO: cycle through all regimes
  const regime = await Regime.find('wrls')
  const regions = ['A', 'B', 'E', 'N', 'S', 'T', 'W', 'Y']

  for (let n = 0; n < regions.length; n++) {
    try {
      // generate files for any pending changes
      await GenerateRegionCustomerFile.call(regime, regions[n])
      // export any files waiting to go for the region
      await ExportRegionCustomerFile.call(regime, regions[n])
    } catch (err) {
      logger.error(err)
    }
  }

  logger.info('customer-file-export-job - done')
}

module.exports = {
  run
}
