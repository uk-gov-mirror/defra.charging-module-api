ALTER TABLE IF EXISTS bill_runs
  ALTER COLUMN credit_value TYPE bigint;

ALTER TABLE IF EXISTS bill_runs
  ALTER COLUMN invoice_value TYPE bigint;

ALTER TABLE IF EXISTS bill_runs
  ALTER COLUMN credit_line_value TYPE bigint;

ALTER TABLE IF EXISTS bill_runs
  ALTER COLUMN debit_line_value TYPE bigint;

ALTER TABLE IF EXISTS bill_runs
  ALTER COLUMN net_total TYPE bigint;
