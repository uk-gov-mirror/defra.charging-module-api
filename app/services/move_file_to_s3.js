const path = require('path')
const config = require('../../config/config')
const s3 = require('../lib/connectors/s3')
const RemoveTemporaryFile = require('./remove_temporary_file')

async function call (file, copyToArchive = true) {
  const tmpDir = config.temporaryFilePath
  const filename = path.join(tmpDir, file.filename)
  const uploadKey = path.join('export', file.bucketFileKey)

  await s3.upload('upload', uploadKey, filename)

  if (copyToArchive) {
    await s3.upload('archive', uploadKey, filename)
  }

  // remove temporary file
  if (config.removeTemporaryFiles) {
    return RemoveTemporaryFile.call(file.filename)
  }
  return true
}

module.exports = {
  call
}
