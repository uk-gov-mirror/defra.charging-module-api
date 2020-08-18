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

      const job1 = schedule.scheduleJob(config.fileExportSchedule, async () => {
        await exportFile()
      })
      logger.info(`Transaction Schedule: ${config.fileExportSchedule}`)
      logger.info(`FileExportJob queued - next: ${job1.nextInvocation().toString()}`)

      const job2 = schedule.scheduleJob(config.customerFileExportSchedule, async () => {
        await exportCustomerFiles()
      })
      logger.info(`Customer Schedule: ${config.customerFileExportSchedule}`)
      logger.info(`CustomerFileExportJob queued - next: ${job2.nextInvocation().toString()}`)
    }
  }
}
