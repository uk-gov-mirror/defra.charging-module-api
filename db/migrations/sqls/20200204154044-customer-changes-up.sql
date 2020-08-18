CREATE TABLE IF NOT EXISTS customer_changes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    regime_id uuid NOT NULL REFERENCES regimes(id) ON DELETE CASCADE,
    customer_file_id uuid REFERENCES customer_files(id) ON DELETE SET NULL,
    region varchar NOT NULL,
    customer_reference varchar NOT NULL,
    customer_name varchar NOT NULL,
    address_line_1 varchar NOT NULL,
    address_line_2 varchar,
    address_line_3 varchar,
    address_line_4 varchar,
    address_line_5 varchar,
    address_line_6 varchar,
    postcode varchar,
    status varchar NOT NULL DEFAULT 'initialised',
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_customer_changes_updated
BEFORE UPDATE ON customer_changes
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();
