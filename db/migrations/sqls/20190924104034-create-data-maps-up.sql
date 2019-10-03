/* Regime specific data maps for transaction and charge attributes */
CREATE TYPE data_map_type AS ENUM ('transaction', 'charge', 'sroc_transaction', 'sroc_charge');

CREATE TABLE IF NOT EXISTS data_maps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    regime_id uuid NOT NULL REFERENCES regimes(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT NOW() NOT NULL,
    updated_at timestamp with time zone DEFAULT NOW() NOT NULL,
    map_type data_map_type NOT NULL,
    data_map json
);

CREATE TRIGGER trg_data_maps_updated
BEFORE UPDATE ON data_maps
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();
