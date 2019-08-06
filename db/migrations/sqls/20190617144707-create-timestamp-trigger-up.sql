-- https://x-team.com/blog/automatic-timestamps-with-postgresql/

CREATE OR REPLACE FUNCTION charging.set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
