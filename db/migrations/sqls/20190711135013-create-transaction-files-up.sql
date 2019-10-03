CREATE TABLE IF NOT EXISTS transaction_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    regime_id uuid REFERENCES regimes(id) ON DELETE CASCADE,
    region varchar NOT NULL,
    file_id varchar,
    status varchar NOT NULL DEFAULT 'initialised',
    file_generated_at timestamp with time zone,
    debit_total bigint,
    debit_count integer,
    credit_total bigint,
    credit_count integer,
    net_total bigint,
    pre_sroc boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW(),
    file_reference varchar
);

CREATE TRIGGER trg_transaction_files_updated
BEFORE UPDATE ON transaction_files
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();
