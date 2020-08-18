/* Authorised systems table */
CREATE TABLE IF NOT EXISTS authorised_systems (
  id varchar PRIMARY KEY,
  name varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT NOW() NOT NULL,
  updated_at timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_authorised_systems_updated
BEFORE UPDATE ON authorised_systems
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();

CREATE TABLE IF NOT EXISTS regime_authorisations (
  regime_id uuid NOT NULL REFERENCES regimes(id) ON DELETE CASCADE,
  authorised_system_id varchar NOT NULL REFERENCES authorised_systems(id) ON DELETE CASCADE,
  last_accessed_at timestamp with time zone
);
