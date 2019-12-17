/* sequence counters table */
CREATE TABLE IF NOT EXISTS sequence_counters (
    regime_id uuid NOT NULL REFERENCES regimes(id) ON DELETE CASCADE,
    region varchar NOT NULL,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone DEFAULT NOW() NOT NULL,
    file_number integer NOT NULL DEFAULT 0,
    transaction_number integer NOT NULL DEFAULT 0,
    bill_run_number integer NOT NULL DEFAULT 10000,
    draft_transaction_number integer NOT NULL DEFAULT 0,
    draft_bill_run_number integer NOT NULL DEFAULT 10000,
    PRIMARY KEY(regime_id, region)
);

CREATE TRIGGER trg_sequence_counters_updated
BEFORE UPDATE ON sequence_counters
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();

INSERT INTO sequence_counters (regime_id, region)
SELECT id, unnest(array['A','B','E','N','S','T','W','Y']) region FROM regimes WHERE slug='wrls';
