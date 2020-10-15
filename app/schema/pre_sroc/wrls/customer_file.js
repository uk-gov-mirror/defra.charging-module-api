const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')
const CustomerFile = require('../../../models/customer_file')
const SequenceCounter = require('../../../models/sequence_counter')

class WrlsCustomerFile extends CustomerFile {
  constructor (regimeId, params) {
    super(regimeId, params)
    this.preSroc = true
    this.summaries = []
    this.sequenceCounter = new SequenceCounter(regimeId, this.region)
  }

  async generateFileId () {
    this.file_reference = 50000 + await this.sequenceCounter.nextCustomerFileNumber()
    return this.file_reference
  }

  get fileId () {
    return this.file_reference
  }

  get filename () {
    return `nal${this.region.toLowerCase()}c${this.fileId}.dat`
  }

  get bucketFileKey () {
    return `wrls/customer/${this.filename}`
  }

  static validate (data) {
    return Joi.validate(data, this.schema, { abortEarly: false })
  }

  static translate (data) {
    // translate filter values using main attribute map for pre-sroc WRLS naming
    return utils.translateData(data, AttributeMap)
  }

  static async instanceFromRequest (regimeId, params) {
    const { error, value } = this.validate(params)
    if (error) {
      throw error
    }

    return this.build(regimeId, value)
  }

  static orderSearchQuery (sort, sortDir) {
    // default sort order for WRLS is customer_reference and licence_number (line_attr_1) asc
    const order = []
    const defaultCols = ['region', 'file_reference']
    let sortCols = []
    let sortDirection = 'asc'

    if (sortDir && sortDir.toUpperCase() === 'DESC') {
      sortDirection = 'desc'
    }

    if (sort) {
      let cols
      if (sort instanceof Array) {
        cols = sort
      } else {
        cols = sort.split(',')
      }

      for (let i = 0; i < cols.length; i++) {
        const col = cols[i]
        if (col) {
          sortCols.push(col)
        }
      }
    }

    if (sortCols.length === 0) {
      sortCols = defaultCols
    }

    for (let i = 0; i < sortCols.length; i++) {
      order.push(`${sortCols[i]} ${sortDirection}`)
    }

    order.push(`created_at ${sortDirection}`)

    return order
  }

  static get schema () {
    return {
      region: Joi.string().uppercase().length(1).required()
    }
  }

  toJSON () {
    const result = {
      id: this.id,
      region: this.region,
      filename: this.filename,
      status: this.prettyStatus,
      createdDate: utils.formatDate(this.created_at)
    }
    if (this.changes) {
      result.customerChanges = this.changes
    }
    return result
  }

  static get rawQuery () {
    return `SELECT id,
      region,
      file_reference,
      status,
      created_at
      FROM customer_files`
  }
}

module.exports = WrlsCustomerFile
