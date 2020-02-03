const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const { expect } = Code
const TransactionFilePresenter = require('../../../../app/schema/pre_sroc/wrls/transaction_file_presenter')

describe('Transaction File Presenter (WRLS): blankWhenCompensationCharge', () => {
  it('returns an empty string instead of the given value when compensationCharge is true', async () => {
    const dummyRecord = { regime_value_17: 'true' }
    const presenter = new TransactionFilePresenter({})

    expect(presenter.blankWhenCompensationCharge(dummyRecord, 'banana')).to.equal('')
  })

  it('returns the given value when compensationCharge is false', async () => {
    const dummyRecord = { regime_value_17: 'false' }
    const presenter = new TransactionFilePresenter({})

    expect(presenter.blankWhenCompensationCharge(dummyRecord, 'banana')).to.equal('banana')
  })
})

describe('Transaction File Presenter (WRLS): blankUnlessCompensationCharge', () => {
  it('returns an empty string instead of the given value when compensationCharge is not true', async () => {
    const dummyRecord = { regime_value_17: 'false' }
    const presenter = new TransactionFilePresenter({})

    expect(presenter.blankUnlessCompensationCharge(dummyRecord, 'banana')).to.equal('')
  })

  it('returns the given value when compensationCharge is true', async () => {
    const dummyRecord = { regime_value_17: 'true' }
    const presenter = new TransactionFilePresenter({})

    expect(presenter.blankUnlessCompensationCharge(dummyRecord, 'banana')).to.equal('banana')
  })
})
