// WRLS Pre-SRoC Attribute Map - WRLS naming to DB column

module.exports = {
  region: 'region',
  periodStart: 'charge_period_start',
  periodEnd: 'charge_period_end',
  customerReference: 'customer_reference',
  batchNumber: 'regime_value_1',
  invoiceDate: 'header_attr_1',
  licenceNumber: 'line_attr_1',
  chargePeriod: 'line_attr_2',
  chargeElementId: 'regime_value_3',
  billableDays: 'regime_value_4',
  authorisedDays: 'regime_value_5',
  prorataDays: 'line_attr_3',
  volume: 'line_attr_5',
  source: 'regime_value_6',
  sourceFactor: 'line_attr_6',
  season: 'regime_value_7',
  seasonFactor: 'line_attr_7',
  loss: 'regime_value_8',
  lossFactor: 'line_attr_8',
  section130Agreement: 'regime_value_9',
  licenceHolderChargeAgreement: 'line_attr_9',
  // section130Factor: 'regime_value_18',
  section126Agreement: 'regime_value_10',
  chargeElementAgreement: 'line_attr_10',
  section126Factor: 'regime_value_11',
  section127Agreement: 'regime_value_12',
  // section127Factor: 'regime_value_19',
  twoPartTariff: 'regime_value_16',
  compensationCharge: 'regime_value_17',
  eiucSource: 'regime_value_13',
  eiucSourceFactor: 'line_attr_13',
  waterUndertaker: 'regime_value_14',
  regionalChargingArea: 'regime_value_15',
  eiuc: 'line_attr_14',
  suc: 'line_attr_4',
  chargeValue: 'charge_value',
  credit: 'charge_credit',
  transactionDate: 'transaction_date',
  areaCode: 'line_area_code',
  lineDescription: 'line_description',
  transactionStatus: 'status',
  approvedForBilling: 'approved_for_billing',
  currencyLineAmount: 'currency_line_amount',
  unitOfMeasurePrice: 'unit_of_measure_price',
  preSroc: 'pre_sroc',
  financialYear: 'charge_financial_year',
  transactionType: 'transaction_type',
  transactionReference: 'transaction_reference',
  transactionFileReference: 'transaction_filename',
  billRunId: 'bill_run_number',
  calculation: 'charge_calculation',
  newLicence: 'new_licence'
}
