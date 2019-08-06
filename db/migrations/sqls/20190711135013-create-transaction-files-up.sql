CREATE TABLE charging.transaction_files (
    id SERIAL PRIMARY KEY,
    slug character varying NOT NULL,
    regime_id bigint REFERENCES charging.regimes(id) ON DELETE CASCADE,
    region character varying NOT NULL,
    file_id character varying,
    status character varying DEFAULT 'initialised'::character varying NOT NULL,
    file_generated_at timestamp with time zone,
    debit_total bigint,
    debit_count integer,
    credit_total bigint,
    credit_count integer,
    net_total bigint,
    pre_sroc boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone DEFAULT NOW() NOT NULL,
    file_reference character varying
);

CREATE UNIQUE INDEX idx_transaction_files_slug
ON charging.transaction_files(slug);

ALTER TABLE charging.transaction_files
ADD CONSTRAINT uni_transaction_files_slug
UNIQUE USING INDEX idx_transaction_files_slug;

CREATE TRIGGER trg_transaction_files_updated
BEFORE UPDATE ON charging.transaction_files
FOR EACH ROW
EXECUTE PROCEDURE charging.set_timestamp();
