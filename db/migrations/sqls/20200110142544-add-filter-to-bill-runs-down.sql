ALTER TABLE IF EXISTS bill_runs
ALTER COLUMN file_reference TYPE varchar USING file_reference::varchar,
DROP COLUMN IF EXISTS filter;
