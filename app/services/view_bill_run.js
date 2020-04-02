const Boom = require('@hapi/boom')
// const Joi = require('@hapi/joi')
// const AttributeMap = require('./attribute_map')
// const utils = require('../../../lib/utils')
// const Validations = require('./validations')
const GenerateBillRunSummary = require('./generate_bill_run_summary')

async function call (request) {
  // retrieve billrun data
  const billRun = await request.model.find(request.regimeId, request.billRunId)
  if (!billRun) {
    throw Boom.notFound(`No BillRun found with id '${request.billRunId}'`)
  }

  if (!billRun.summary_data) {
    await GenerateBillRunSummary.call(billRun, false)
  }

  // pull out either customer summary or licence
  return billRun.summary(request.searchParams)
}

// class WrlsViewBillRun {
//   constructor (regimeId, billRunId, params) {
//     this.regimeId = regimeId
//     this.billRunId = billRunId

//     if (params) {
//       const { error, value } = this.constructor.validate(params)
//       if (error) {
//         throw Boom.badData(error)
//       }

//       Object.assign(this, value)
//     }
//   }

//   async execute () {

//   }

//   get searchParams () {
//     const params = {}
//     this.constructor.inputCols.forEach(k => {
//       const mappedName = AttributeMap[k]
//       if (k && this[k]) {
//         params[mappedName] = this[k]
//       }
//     })
//     params.regime_id = this.regimeId
//     params.pre_sroc = true
//     return params
//   }

//   get whereClause () {
//     const where = []
//     const values = []
//     const params = this.searchParams
//     let attrCount = 1

//     Object.keys(params).forEach(col => {
//       if (col) {
//         const val = params[col]

//         if (val && val.indexOf && val.indexOf('%') !== -1) {
//           where.push(`${col} like $${attrCount++}`)
//         } else {
//           where.push(`${col}=$${attrCount++}`)
//         }
//         values.push(val)
//       }
//     })

//     return {
//       where,
//       values
//     }
//   }

//   get offset () {
//     return (this.page - 1) * this.perPage
//   }

//   get limit () {
//     return this.perPage
//   }

//   async totalCount (db) {
//     const { where, values } = this.whereClause
//     const q = `SELECT COUNT(*) FROM bill_runs WHERE ${where.join(' AND ')}`

//     const result = await db.query(q, values)
//     return parseInt(result.rows[0].count)
//   }

//   async query (db) {
//     const { where, values } = this.whereClause
//     const whr = where.join(' AND ')

//     const q = `
//       SELECT id,
//       region,
//       bill_run_reference AS "billRunId",
//       file_reference AS "filename",
//       to_char(created_at, 'DD-MON-YYYY') AS "creationDate",
//       status,
//       credit_count AS "creditCount",
//       credit_value AS "creditValue",
//       invoice_count AS "invoiceCount",
//       invoice_value AS "invoiceValue",
//       credit_line_count AS "creditLineCount",
//       credit_line_value AS "creditLineValue",
//       debit_line_count AS "debitLineCount",
//       debit_line_value AS "debitLineValue",
//       net_total AS "netTotal"
//       FROM bill_runs
//       WHERE ${whr}
//       ORDER BY ${this.orderQuery().join(',')}
//       OFFSET ${this.offset} LIMIT ${this.limit}
//     `
//     return db.query(q, values)
//   }

//   orderQuery () {
//     // default sort order for WRLS is customer_reference, licence_number (line_attr_1), transaction_reference asc
//     // const order = []
//     const defaultCols = ['region', 'bill_run_reference']
//     let sortCols = []
//     // const sortDirection = this.sortDir

//     if (this.sort) {
//       let cols
//       if (this.sort instanceof Array) {
//         cols = this.sort
//       } else {
//         cols = this.sort.split(',')
//       }

//       for (let i = 0; i < cols.length; i++) {
//         const col = AttributeMap[cols[i]]
//         if (col) {
//           sortCols.push(col)
//         }
//       }
//     }

//     if (sortCols.length === 0) {
//       sortCols = defaultCols
//     }

//     const order = sortCols.map(c => {
//       return `${c} ${this.sortDir}`
//     })

//     // for (let i = 0; i < sortCols.length; i++) {
//     //   order.push(`${sortCols[i]} ${sortDirection}`)
//     // }

//     // add additional sub-sort on customer reference
//     // if (!sortCols.includes('customer_reference')) {
//     //   order.push(`customer_reference ${this.sortDir}`)
//     // }
//     order.push(`created_at ${this.sortDir}`)

//     return order
//   }

//   static validate (data) {
//     return Joi.validate(data, this.schema, { abortEarly: false })
//   }

//   static translate (data) {
//     // translate filter values using main attribute map for pre-sroc WRLS naming
//     return utils.translateData(data, AttributeMap)
//   }

//   static async instanceFromRequest (regimeId, params) {
//     const { error, value } = this.validate(params)
//     if (error) {
//       throw Boom.badData(error)
//     }

//     return new this(regimeId, value)
//   }

//   static get inputCols () {
//     return [
//       'region',
//       'batchNumber',
//       'customerReference',
//       'licenceNumber',
//       'chargeElementId',
//       'financialYear',
//       'billRunId',
//       'transactionFileReference',
//       'transactionReference'
//     ]
//   }

//   static get schema () {
//     return {
//       region: Validations.regionValidator,
//       batchNumber: Validations.stringValidator,
//       customerReference: Validations.customerReferenceValidator,
//       licenceNumber: Validations.stringValidator,
//       chargeElementId: Validations.stringValidator,
//       financialYear: Validations.financialYearValidator,
//       billRunId: Joi.number().integer().min(10000).max(99999),
//       transactionFileReference: Validations.fileReferenceValidator,
//       transactionReference: Validations.transactionReferenceValidator,
//       page: Validations.pageValidator,
//       perPage: Validations.perPageValidator,
//       sort: Joi.string(),
//       sortDir: Joi.string().lowercase().valid('asc', 'desc').default('asc')
//     }
//   }
// }

module.exports = {
  call
}