// const Boom = require('@hapi/boom')
// const utils = require('../lib/utils')
const fs = require('fs')
const path = require('path')
const stream = require('stream')
const util = require('util')
const config = require('../../config/config')

const finished = util.promisify(stream.finished)

// generate a transaction file for the bill run
async function call (db, presenter) {
  const tmpDir = config.temporaryFilePath
  const filename = path.join(tmpDir, presenter.filename)

  // create file
  const f = fs.createWriteStream(filename)
  // output header
  await presenter.header(db, f)
  // output all the transactions
  await presenter.body(db, f)
  // output footer
  await presenter.trailer(db, f)
  // close stream
  f.end()

  await finished(f)
  return true
}

module.exports = {
  call
}
