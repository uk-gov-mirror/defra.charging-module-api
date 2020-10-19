const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const { expect } = Code
const BillRun = require('../../app/models/bill_run')

describe('BillRun model', () => {
  it('handles pg database driver returning bigint properties as strings', async () => {
    const billRun = new BillRun(
      'foo',
      {
        credit_value: '0',
        invoice_value: '0',
        credit_line_value: '0',
        debit_line_value: '0',
        net_total: '0'
      }
    )

    expect(billRun.credit_value).to.be.a.number()
    expect(billRun.invoice_value).to.be.a.number()
    expect(billRun.credit_line_value).to.be.a.number()
    expect(billRun.debit_line_value).to.be.a.number()
    expect(billRun.net_total).to.be.a.number()
  })
})
