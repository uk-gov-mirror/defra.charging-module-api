const fs = require('fs')
const path = require('path')
const config = require('../../config/config')

async function call (filename) {
  const tmpDir = config.temporaryFilePath
  const file = path.join(tmpDir, filename)

  return new Promise((resolve, reject) => {
    fs.unlink(file, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(true)
      }
    })
  })
}

module.exports = {
  call
}
