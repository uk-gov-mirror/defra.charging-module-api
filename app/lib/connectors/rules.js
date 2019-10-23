const config = require('../../../config/config')
const { logger } = require('../../lib/logger')

async function calculateCharge (regime, chargeParams) {
  return rp(buildRequest(regime, chargeParams))
}

async function replyWithError (error) {
  let payload = {}

  try {
    if (typeof(error.error) !== "undefined" && error.error !== null) {
      payload = { calculation: { messages: error.error.message } }
    } else {
      payload = { calculation: { messages: error.message } }
    }
    console.log("========== Handling error from Rules service ==========")
    console.log(payload)
    console.log("=======================================================")
    this.reply(payload).code(500)
  } catch (err) {
    console.log(err)
  }
}

function buildRequest (regime, payload) {
    // Rules service details
    const service = config.decisionService
    // The rules service end-points are per regime
    // Charge financial year is used to infer version of end-point application
    const year = payload.financialYear
    // Charge request data to pass to rules service
    const chargeRequest = payload.chargeRequest

    let options = {
      method: 'POST',
      uri: this.makeRulesPath(regime, year),
      body: {
        tcmChargingRequest: chargeRequest
      },
      json: true,
      auth: {
        username: service.username,
        password: service.password
      }
    }
    if (config.httpProxy) {
      options['proxy'] = config.httpProxy
    }

    return options
  }

  buildReply (data) {
    return ({
      uuid: data.__DecisionID__,
      generatedAt: new Date(),
      calculation: data.tcmChargingResponse
    })
  }

  makeRulesPath (regime, year) {
    // generate the url for the correct regime, year and ruleset
    const endpoint = config.decisionService.endpoints[regime.toLowerCase()]
    const fy = '_' + year + '_' + (year - 1999)
    return (
      config.decisionService.url + '/' + endpoint.application + '/' + endpoint.ruleset + fy
    )
  }

  makeOldRulesPath (regime, year) {
    // generate the url for the correct regime, year and ruleset
    const endpoint = config.endpoints[regime.toLowerCase()]
    return (
      config.decisionService.url + '/' + endpoint.application + '/' + endpoint.ruleset
    )
  }

const fs = require('fs')
const aws = require('aws-sdk')
const config = require('../../../config/config')

/**
 * List the contents of a S3 bucket
 * @param  {string} bucketName The name of the bucket config
 * @param  {object} options    Optional params passed to AWS S3 call e.g. Prefix
 * @return {Promise<string[]>}    Filenames (keys) of returned from the bucket
 */
function list (bucketName, options = {}) {
  const bucket = bucketConfig(bucketName)
  const s3 = connector(bucket.options)

  return listFiles(s3, Object.assign({ Bucket: bucket.service }, options))
}

/**
 * Download a file from an S3 bucket
 * @param  {string} bucketName  The name of the bucket config
 * @param  {string} key         Key of the object to download from the bucket
 * @param  {string} destination Local filename to store file as
 * @return {Promise<string>}    File will have successfully downloaded when resolved and filename returned
 */
function download (bucketName, key, destination) {
  const bucket = bucketConfig(bucketName)
  const s3 = connector(bucket.options)

  return fetchFile(s3, { Bucket: bucket.service, Key: key }, destination)
}

/**
 * Upload a file to a S3 bucket
 * @param  {string} bucketName  The name of the bucket config
 * @param  {string} key         Key (filename) for the file in S3
 * @param  {string} source      Path to file to upload (on local filesystem)
 * @return {Promise<object>}    Object containing ETag value for the uploaded file once resolved
 */
async function upload (bucketName, key, source) {
  const bucket = bucketConfig(bucketName)
  const s3 = connector(bucket.options)

  const buffer = await readFile(source)

  return s3.putObject({ Bucket: bucket.service, Key: key, Body: buffer }).promise()
}

function readFile (file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

function fetchFile (s3, params, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination)

    file.on('close', () => resolve(destination))

    s3.getObject(params)
      .createReadStream()
      .on('error', err => reject(err))
      .pipe(file)
  })
}

function bucketConfig (bucketName) {
  if (config.s3[bucketName]) {
    return config.s3[bucketName]
  } else {
    throw new Error(`Invalid bucket name ${bucketName}`)
  }
}

function listFiles (s3, params, items = []) {
  return new Promise((resolve, reject) => {
    s3.listObjectsV2(params).promise()
      .then(({ Contents, IsTruncated, NextContinuationToken }) => {
        // add file names (Key) to the list except those with a trailing '/' (pseudo directories)
        items.push(...Contents.map(e => e.Key).filter(file => !file.endsWith('/')))
        if (IsTruncated) {
          // still more to come so add the ContinuationToken and recurse
          resolve(listFiles(s3, Object.assign(params, { ContinuationToken: NextContinuationToken }), items))
        } else {
          resolve(items)
        }
      })
      .catch(err => reject(err))
  })
}

function connector (options) {
  return new aws.S3(options)
}

module.exports = {
  list,
  download,
  upload
}

// Example usage:
//
// list('upload', { Prefix: 'export'}).then(items => console.log(items, items.length)).catch(err => console.error(err))

// download('upload', 'export/wml/WMLTI50016T.DAT', 'myfile.txt')

// upload('archive', 'tony.txt', './Dockerfile').then(v => console.log(v)).catch(err => console.log(err.message))
