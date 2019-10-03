/* Transaction table */
CREATE TABLE IF NOT EXISTS transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    regime_id uuid NOT NULL REFERENCES regimes(id) ON DELETE CASCADE,
    transaction_file_id uuid REFERENCES transaction_files(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone DEFAULT NOW() NOT NULL,
    status varchar NOT NULL DEFAULT 'unbilled',

    -- Start of file attributes
    sequence_number integer,
    customer_reference varchar NOT NULL,
    transaction_date date,
    transaction_type varchar,
    transaction_reference varchar,
    related_reference varchar,
    currency_code varchar NOT NULL DEFAULT 'GBP',
    header_narrative varchar,
    header_attr_1 varchar,
    header_attr_2 varchar,
    header_attr_3 varchar,
    header_attr_4 varchar,
    header_attr_5 varchar,
    header_attr_6 varchar,
    header_attr_7 varchar,
    header_attr_8 varchar,
    header_attr_9 varchar,
    header_attr_10 varchar,
    currency_line_amount integer,
    line_vat_code varchar,
    line_area_code varchar,
    line_description varchar,
    line_income_stream_code varchar,
    line_context_code varchar,
    line_attr_1 varchar,
    line_attr_2 varchar,
    line_attr_3 varchar,
    line_attr_4 varchar,
    line_attr_5 varchar,
    line_attr_6 varchar,
    line_attr_7 varchar,
    line_attr_8 varchar,
    line_attr_9 varchar,
    line_attr_10 varchar,
    line_attr_11 varchar,
    line_attr_12 varchar,
    line_attr_13 varchar,
    line_attr_14 varchar,
    line_attr_15 varchar,
    line_quantity integer NOT NULL DEFAULT 1,
    unit_of_measure varchar NOT NULL DEFAULT 'Each',
    unit_of_measure_price integer,
    -- End of file attributes

    -- Common transaction attributes
    region varchar,
    pre_sroc boolean NOT NULL DEFAULT false,
    approved_for_billing boolean NOT NULL DEFAULT false,
    approved_for_billing_at timestamp with time zone,
    charge_period_start timestamp with time zone,
    charge_period_end timestamp with time zone,
    charge_calculation json,    -- response from charge calculation call
    charge_financial_year varchar,    -- e.g. FY1819
    charge_credit boolean NOT NULL DEFAULT false,

    -- Regime specific extra attributes
    regime_value_1 varchar,
    regime_value_2 varchar,
    regime_value_3 varchar,
    regime_value_4 varchar,
    regime_value_5 varchar,
    regime_value_6 varchar,
    regime_value_7 varchar,
    regime_value_8 varchar,
    regime_value_9 varchar,
    regime_value_10 varchar,
    regime_value_11 varchar,
    regime_value_12 varchar,
    regime_value_13 varchar,
    regime_value_14 varchar,
    regime_value_15 varchar
);

CREATE TRIGGER trg_transactions_updated
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();
