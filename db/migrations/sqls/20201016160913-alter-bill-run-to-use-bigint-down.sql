ALTER TABLE IF EXISTS bill_runs
  ALTER COLUMN credit_value TYPE integer;

ALTER TABLE IF EXISTS bill_runs
  ALTER COLUMN invoice_value TYPE integer;

ALTER TABLE IF EXISTS bill_runs
  ALTER COLUMN credit_line_value TYPE integer;

ALTER TABLE IF EXISTS bill_runs
  ALTER COLUMN debit_line_value TYPE integer;

ALTER TABLE IF EXISTS bill_runs
  ALTER COLUMN net_total TYPE integer;
