const path = require('path')
const config = require('../../config/config')
const s3 = require('../lib/connectors/s3')
const RemoveTemporaryFile = require('./remove_temporary_file')

async function call (billRun) {
  const tmpDir = config.temporaryFilePath
  const filename = path.join(tmpDir, billRun.filename)
  const uploadKey = path.join('export', billRun.bucketFileKey)

  await s3.upload('upload', uploadKey, filename)
  await s3.upload('archive', uploadKey, filename)

  // remove temporary file
  if (config.removeTemporaryFiles) {
    return RemoveTemporaryFile.call(billRun.filename)
  }
  return true
}

module.exports = {
  call
}
