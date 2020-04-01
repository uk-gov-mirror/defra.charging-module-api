ALTER TABLE IF EXISTS bill_runs
ADD COLUMN approved_for_billing boolean NOT NULL DEFAULT false,
ADD COLUMN approved_for_billing_at timestamp with time zone,
ADD COLUMN summary_data json,
ALTER COLUMN status SET DEFAULT 'initialised';
