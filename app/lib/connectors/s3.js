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
