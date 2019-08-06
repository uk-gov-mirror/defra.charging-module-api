/* Transaction table */
CREATE TABLE IF NOT EXISTS charging.transactions (
    id SERIAL PRIMARY KEY,
    slug character varying NOT NULL,
    regime_id bigint NOT NULL REFERENCES charging.regimes(id) ON DELETE CASCADE,
    transaction_file_id bigint REFERENCES charging.transaction_files(id) ON DELETE SET NULL,
    -- Start of file attributes
    sequence_number integer,
    customer_reference character varying NOT NULL,
    transaction_date date,
    transaction_type character varying,
    transaction_reference character varying,
    related_reference character varying,
    currency_code character varying DEFAULT 'GBP'::character varying,
    header_narrative character varying,
    header_attr_1 character varying,
    header_attr_2 character varying,
    header_attr_3 character varying,
    header_attr_4 character varying,
    header_attr_5 character varying,
    header_attr_6 character varying,
    header_attr_7 character varying,
    header_attr_8 character varying,
    header_attr_9 character varying,
    header_attr_10 character varying,
    currency_line_amount integer,
    line_vat_code character varying,
    line_area_code character varying,
    line_description character varying,
    line_income_stream_code character varying,
    line_context_code character varying,
    line_attr_1 character varying,
    line_attr_2 character varying,
    line_attr_3 character varying,
    line_attr_4 character varying,
    line_attr_5 character varying,
    line_attr_6 character varying,
    line_attr_7 character varying,
    line_attr_8 character varying,
    line_attr_9 character varying,
    line_attr_10 character varying,
    line_attr_11 character varying,
    line_attr_12 character varying,
    line_attr_13 character varying,
    line_attr_14 character varying,
    line_attr_15 character varying,
    line_quantity integer DEFAULT 1,
    unit_of_measure character varying DEFAULT 'Each'::character varying,
    unit_of_measure_price integer,
    -- End of file attributes
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone DEFAULT NOW() NOT NULL,
    status character varying DEFAULT 'unbilled'::character varying NOT NULL,
    source_reference_1 character varying,  -- queryable source reference values
    source_reference_2 character varying,
    source_reference_3 character varying,
    source_reference_4 character varying,
    charge_period_start timestamp with time zone,
    charge_period_end timestamp with time zone,
    charge_calculation json,    -- response from charge calculation call
    charge_financial_year character varying,    -- e.g. FY1819
    charge_credit boolean DEFAULT false NOT NULL,
    region character varying,
    approved_for_billing boolean DEFAULT false NOT NULL,
    approved_for_billing_at timestamp with time zone
);

CREATE UNIQUE INDEX idx_transactions_slug
ON charging.transactions(slug);

ALTER TABLE charging.transactions
ADD CONSTRAINT uni_transactions_slug
UNIQUE USING INDEX idx_transactions_slug;

CREATE TRIGGER trg_transactions_updated
BEFORE UPDATE ON charging.transactions
FOR EACH ROW
EXECUTE PROCEDURE charging.set_timestamp();
