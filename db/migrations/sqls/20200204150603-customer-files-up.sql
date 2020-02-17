CREATE TABLE IF NOT EXISTS customer_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    regime_id uuid NOT NULL REFERENCES regimes(id) ON DELETE CASCADE,
    region varchar NOT NULL,
    file_reference varchar,
    status varchar NOT NULL DEFAULT 'initialised',
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_customer_files_updated
BEFORE UPDATE ON customer_files
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();
