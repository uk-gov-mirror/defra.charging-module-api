const Joi = require('@hapi/joi')
const AttributeMap = require('./attribute_map')
const { formatDate, translateData } = require('../../../lib/utils')
const BillRun = require('../../../models/bill_run')
const SequenceCounter = require('../../../models/sequence_counter')
const { regionValidator } = require('./validations')

class WrlsBillRun extends BillRun {
  constructor (regimeId, params) {
    super(regimeId, params)
    this.preSroc = true
    this.sequenceCounter = new SequenceCounter(regimeId, this.region)
  }

  addSummary (summary) {
    if (!this.summary_data) {
      this.summary_data = {
        customers: []
      }
    }
    this.summary_data.customers.push(summary)
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

  summary (searchParams = {}) {
    const data = {
      id: this.id,
      billRunId: this.bill_run_number,
      region: this.region,
      status: this.status,
      approvedForBilling: this.approved_for_billing,
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
      customers: []
    }

    if (this.summary_data) {
      let customersSummary = this.summary_data.customers

      if (searchParams.licenceNumber) {
        // get customer data with this licence and recalc customer totals
        customersSummary = this.summary_data.customers.filter(c => {
          const result1 = c.summary.filter(s => {
            s.transactions = s.transactions.filter(t => t.line_attr_1 === searchParams.licenceNumber)
            if (s.transactions.length) {
              s.credit_line_count = 0
              s.credit_line_value = 0
              s.debit_line_count = 0
              s.debit_line_value = 0
              s.net_total = 0
              s.transactions.forEach(t => {
                if (t.charge_value < 0) {
                  s.credit_line_count++
                  s.credit_line_value += t.charge_value
                } else {
                  s.debit_line_count++
                  s.debit_line_value += t.charge_value
                }
                s.net_total += t.charge_value
              })
              return true
            }
            return false
          })
          return result1 && result1.length
        })
      } else if (searchParams.customerReference) {
        // get customer data block for this customer reference
        customersSummary = this.summary_data.customers.filter(c => c.customer_reference === searchParams.customerReference)
      }

      data.customers = customersSummary.map(s => {
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
                  chargeValue: t.charge_value,
                  licenceNumber: t.line_attr_1,
                  minimumChargeAdjustment: t.minimum_charge_adjustment
                }
              })
            }
          })
        }
      })
    }

    if (this.isSent) { // pending or billed
      if (this.customerFilename) {
        data.customerFile = {
          id: this.customer_file_id,
          filename: this.customerFilename
        }
      }
      data.filename = this.filename
      if (this.fileDate) {
        data.fileDate = this.fileDate
      }
    }

    return data
  }

  async generateBillRunId () {
    this.bill_run_number = await this.sequenceCounter.nextBillRunNumber()
    return this.bill_run_number
  }

  async generateFileId () {
    if (this.draft) {
      throw new Error('Attempted to generate draft file id')
    } else {
      this.file_reference = 50000 + await this.sequenceCounter.nextFileNumber()
    }
    return this.file_reference
  }

  // attributes returned for each trnasaction in the customer summary sections
  get summaryAdditionalAttributes () {
    // line_attr_1 == licenceNumber
    return ['line_attr_1', 'minimum_charge_adjustment']
  }

  get billRunId () {
    return this.bill_run_number
  }

  get fileId () {
    return this.file_reference
  }

  get filename () {
    if (this.fileId) {
      return `nal${this.region.toLowerCase()}i${this.fileId}.dat`
    }
    return null
  }

  get fileDate () {
    if (this.file_created_at) {
      return formatDate(this.file_created_at)
    }
    return null
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
    return translateData(data, AttributeMap)
  }

  static async instanceFromRequest (regimeId, params) {
    const { error, value } = this.validate(params)
    if (error) {
      throw error
    }

    // value.filter = this.translate(value.filter)
    const instance = this.build(regimeId, value)
    await instance.generateBillRunId()
    return instance
  }

  static get schema () {
    return {
      region: regionValidator.required()
    }
  }

  toJSON () {
    return this.summary()
  }
}

module.exports = WrlsBillRun
