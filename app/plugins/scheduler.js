const schedule = require('node-schedule')
const config = require('../../config/config')
const FileExportJob = require('../jobs/file_export_job')
const CustomerFileExportJob = require('../jobs/customer_file_export_job')
const { logger } = require('../lib/logger')

module.exports = {
  plugin: {
    name: 'schedule',
    register: async (server, options) => {
      const exportFile = async () => {
        try {
          await FileExportJob.run()
        } catch (err) {
          logger.error(err)
        }
      }

      const exportCustomerFiles = async () => {
        try {
          await CustomerFileExportJob.run()
        } catch (err) {
          logger.error(err)
        }
      }

      schedule.scheduleJob(config.fileExportSchedule, async () => {
        await exportFile()
      })

      schedule.scheduleJob(config.customerFileSchedule, async () => {
        await exportCustomerFiles()
      })
    }
  }
}
