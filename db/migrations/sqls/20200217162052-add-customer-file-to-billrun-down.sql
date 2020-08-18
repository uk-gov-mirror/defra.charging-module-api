ALTER TABLE IF EXISTS bill_runs
DROP COLUMN IF EXISTS customer_file_id,
DROP COLUMN IF EXISTS customer_filename;
