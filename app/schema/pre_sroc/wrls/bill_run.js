const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const utils = require('../../../lib/utils')
const BillRun = require('../../../models/bill_run')
const SequenceCounter = require('../../../models/sequence_counter')

class WrlsBillRun extends BillRun {
  constructor (regimeId, params) {
    super(regimeId, params)
    this.preSroc = true
    this.summaries = []
    this.sequenceCounter = new SequenceCounter(regimeId, this.region)
  }

  addSummary (summary) {
    this.summaries.push(summary)
    summary.summary.forEach(s => {
      this.credit_line_count += s.credit_line_count
      this.credit_line_value += s.credit_line_value
      this.debit_line_count += s.debit_line_count
      this.debit_line_value += s.debit_line_value

      if (s.net_total >= 0) {
        this.invoice_count++
        this.invoice_value += s.net_total
      } else {
        this.credit_count++
        this.credit_value += s.net_total
      }
      this.net_total += s.net_total
    })
  }

  async generateBillRunId () {
    if (this.draft) {
      this.bill_run_reference = await this.sequenceCounter.nextDraftBillRunNumber()
    } else {
      this.bill_run_reference = await this.sequenceCounter.nextBillRunNumber()
    }
    return this.bill_run_reference
  }

  async generateFileId () {
    if (this.draft) {
      throw new Error('Attempted to generate draft file id')
    } else {
      this.file_reference = 50000 + await this.sequenceCounter.nextFileNumber()
    }
    return this.file_reference
  }

  get billRunId () {
    return this.bill_run_reference
  }

  get fileId () {
    return this.file_reference
  }

  get filename () {
    return `nal${this.region.toLowerCase()}i${this.fileId}.dat`
  }

  get customerFilename () {
    return this.customer_filename
  }

  get bucketFileKey () {
    return `wrls/transaction/${this.filename}`
  }

  async generateTransactionRef (isCredit) {
    // The transaction reference for a final billing run should take
    // the format RAX1999999, where
    // R is the region indicator,
    // A is a fixed digit "A", ("Z" for draft type)
    // X is the Transaction Type (C or I),
    // 1 is a fixed digit "1"
    // 999999 is a sequential 6-digit numeric string (with a separate sequence per region).
    let seqNum, ch

    if (this.draft) {
      seqNum = await this.sequenceCounter.nextDraftTransactionNumber()
      ch = 'Z' // indicate that this is a draft number
    } else {
      seqNum = await this.sequenceCounter.nextTransactionNumber()
      ch = 'A'
    }

    const ref = `${this.region}${ch}${isCredit ? 'C' : 'I'}1${('000000' + seqNum).slice(-6)}`
    return ref
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

    value.filter = this.translate(value.filter)
    const instance = this.build(regimeId, value)
    await instance.generateBillRunId()
    return instance
  }

  static get schema () {
    return {
      region: Joi.string().uppercase().length(1).required(),
      draft: Joi.boolean(),
      filter: Joi.object({
        batchNumber: Joi.string().allow(null),
        customerReference: Joi.string().uppercase().allow(null),
        financialYear: Joi.number().integer().min(2000).max(2020).allow(null)
      }).optional().default([])
    }
  }

  toJSON () {
    const data = {
      billRunId: this.bill_run_reference,
      region: this.region,
      draft: this.draft,
      summary: {
        creditNoteCount: this.credit_count,
        creditNoteValue: this.credit_value,
        invoiceCount: this.invoice_count,
        invoiceValue: this.invoice_value,
        creditLineCount: this.credit_line_count,
        creditLineValue: this.credit_line_value,
        debitLineCount: this.debit_line_count,
        debitLineValue: this.debit_line_value,
        netTotal: this.net_total
      },
      customers: this.summaries.map(s => {
        return {
          customerReference: s.customer_reference,
          summaryByFinancialYear: s.summary.map(ss => {
            return {
              financialYear: ss.financial_year,
              creditLineCount: ss.credit_line_count,
              creditLineValue: ss.credit_line_value,
              debitLineCount: ss.debit_line_count,
              debitLineValue: ss.debit_line_value,
              netTotal: ss.net_total,
              transactions: ss.transactions.map(t => {
                return {
                  id: t.id,
                  chargeValue: t.charge_value
                }
              })
            }
          })
        }
      })
    }

    if (!this.draft) {
      data.filename = this.filename
      if (this.customerFilename) {
        data.customerFilename = this.customerFilename
      }
      data.id = this.id
    }

    return data
  }
}

module.exports = WrlsBillRun
