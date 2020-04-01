ALTER TABLE IF EXISTS transactions
DROP CONSTRAINT "transactions_bill_run_id_fkey",
ADD CONSTRAINT "transactions_bill_run_id_fkey"
FOREIGN KEY (bill_run_id)
REFERENCES bill_runs(id)
ON DELETE SET NULL;
