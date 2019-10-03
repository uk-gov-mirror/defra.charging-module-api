INSERT INTO transactions
(
    regime_id,
    sequence_number,
    customer_reference,
    transaction_date,
    transaction_type,
    transaction_reference,
    header_attr_1,
    currency_line_amount,
    line_area_code,
    line_description,
    line_income_stream_code,
    line_attr_1,
    line_attr_2,
    line_attr_3,
    line_attr_4,
    line_attr_5,
    line_attr_6,
    line_attr_7,
    line_attr_8,
    unit_of_measure_price,
    region,
    pre_sroc,
    charge_period_start,
    charge_period_end,
    charge_financial_year,
    charge_credit
)
SELECT
    id,
    216,
    'A88895777A',
    '20-Jul-2018',
    'C',
    'AAC0012990',
    '20-Jul-2018',
    -15786,
    'ARCA',
    'Drains within Littleport & Downham IDB',
    'A',
    '6/33/26/*S/0453/R01',
    '01-APR-2018 - 31-MAR-2019',
    '214/214',
    '2751',
    '3.5865 Ml',
    '1',
    '1.6',
    '1',
    -15786,
    'A',
    true,
    '01-APR-2018',
    '31-MAR-2019',
    'FY1819',
    true
FROM regimes
WHERE slug = 'wrls'
;
