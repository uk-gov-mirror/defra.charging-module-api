ALTER TABLE IF EXISTS bill_runs
ADD COLUMN customer_file_id uuid REFERENCES customer_files(id) ON DELETE SET NULL,
ADD COLUMN customer_filename varchar;
