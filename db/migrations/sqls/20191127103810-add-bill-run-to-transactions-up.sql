/* Add charge value and additional regime specific values */
ALTER TABLE IF EXISTS transactions
ADD COLUMN bill_run_number integer,
ADD COLUMN bill_run_id uuid REFERENCES bill_runs(id) ON DELETE SET NULL;
