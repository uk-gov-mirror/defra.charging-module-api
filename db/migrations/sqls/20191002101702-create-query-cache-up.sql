/* Cached SQL queries using data_maps */
CREATE TABLE IF NOT EXISTS query_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    regime_id uuid NOT NULL REFERENCES regimes(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone DEFAULT NOW() NOT NULL,
    name varchar NOT NULL,
    query varchar NOT NULL,
    UNIQUE (regime_id, name)
);

CREATE TRIGGER trg_query_cache_updated
BEFORE UPDATE ON query_cache
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();
