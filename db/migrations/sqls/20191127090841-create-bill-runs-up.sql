/* Bill runs table */
CREATE TABLE IF NOT EXISTS bill_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    regime_id uuid NOT NULL REFERENCES regimes(id) ON DELETE CASCADE,
    transaction_file_id uuid REFERENCES transaction_files(id) ON DELETE SET NULL,
    bill_run_reference integer,
    file_reference varchar,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone DEFAULT NOW() NOT NULL,
    status varchar NOT NULL DEFAULT 'unbilled',

    region varchar NOT NULL,
    pre_sroc boolean NOT NULL DEFAULT false,
    credit_count integer NOT NULL DEFAULT 0,
    credit_value integer NOT NULL DEFAULT 0,
    invoice_count integer NOT NULL DEFAULT 0,
    invoice_value integer NOT NULL DEFAULT 0,
    credit_line_count integer NOT NULL DEFAULT 0,
    credit_line_value integer NOT NULL DEFAULT 0,
    debit_line_count integer NOT NULL DEFAULT 0,
    debit_line_value integer NOT NULL DEFAULT 0,
    net_total integer NOT NULL DEFAULT 0
);

CREATE TRIGGER trg_bill_runs_updated
BEFORE UPDATE ON bill_runs
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();
