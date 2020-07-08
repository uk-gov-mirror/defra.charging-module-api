const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before, beforeEach } = exports.lab = Lab.script()
const { expect } = Code
const { DuplexMock } = require('stream-mock')

const { pool } = require('../../../../app/lib/connectors/db')
const Regime = require('../../../../app/models/regime')
const Schema = require('../../../../app/schema/pre_sroc')
const { cleanTransactions, updateTransaction } = require('../../../helpers/transaction_helper')
const { dummyCharge } = require('../../../helpers/charge_helper')
const { addBillRunTransaction } = require('../../../helpers/bill_run_helper')
const TransactionFilePresenter = require('../../../../app/schema/pre_sroc/wrls/transaction_file_presenter')
const CreateBillRun = require('../../../../app/services/create_bill_run')

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

describe('Transaction File Presenter (WRLS): volumnInMegaLitres', () => {
  it('returns an empty string when compensationCharge is true', async () => {
    const dummyRecord = { regime_value_17: 'true', line_attr_5: '2.345' }
    const presenter = new TransactionFilePresenter({})

    expect(presenter.volumeInMegaLitres(dummyRecord)).to.equal('')
  })

  it('returns the value of line_attr_5 post-fixed with "Ml" when compensationCharge is not true', async () => {
    const dummyRecord = { regime_value_17: 'false', line_attr_5: '2.345' }
    const presenter = new TransactionFilePresenter({})

    expect(presenter.volumeInMegaLitres(dummyRecord)).to.equal('2.345 Ml')
  })
})

describe('Transaction File Presenter (WRLS): presenter', () => {
  let regime
  let schema
  let billRun
  let presenter
  let mockStream

  before(async () => {
    regime = await Regime.find('wrls')
    schema = Schema[regime.slug]
  })

  beforeEach(async () => {
    await cleanTransactions()
    const br = await CreateBillRun.call({ regimeId: regime.id, region: 'A' })
    billRun = await (schema.BillRun).find(regime.id, br.id)
    presenter = new TransactionFilePresenter(billRun)
    mockStream = new DuplexMock()
  })

  it('body contains correct number of entries', async () => {
    const tr1 = await addBillRunTransaction(regime, billRun, dummyCharge)
    const tr2 = await addBillRunTransaction(regime, billRun, dummyCharge)
    const tr3 = await addBillRunTransaction(regime, billRun, dummyCharge)

    // Manually set deminimis flags
    await updateTransaction(tr1, { deminimis: false })
    await updateTransaction(tr2, { deminimis: false })
    await updateTransaction(tr3, { deminimis: false })

    await presenter.body(pool, mockStream)

    const data = mockStream.data.map(line => line.toString())
    expect(data.length).to.equal(3)
  })

  it('body correctly excludes deminimis', async () => {
    const tr1 = await addBillRunTransaction(regime, billRun, dummyCharge)
    const tr2 = await addBillRunTransaction(regime, billRun, dummyCharge)
    const tr3 = await addBillRunTransaction(regime, billRun, dummyCharge)

    // Manually set deminimis flags
    await updateTransaction(tr1, { deminimis: true })
    await updateTransaction(tr2, { deminimis: false })
    await updateTransaction(tr3, { deminimis: false })

    await presenter.body(pool, mockStream)

    const data = mockStream.data.map(line => line.toString())
    expect(data.length).to.equal(2)
  })

  it('body correctly excludes zero value transactions', async () => {
    await addBillRunTransaction(regime, billRun, dummyCharge)
    await addBillRunTransaction(regime, billRun, dummyCharge)
    await addBillRunTransaction(regime, billRun, dummyCharge, { chargeValue: 0 })

    await presenter.body(pool, mockStream)

    const data = mockStream.data.map(line => line.toString())
    expect(data.length).to.equal(2)
  })
})
