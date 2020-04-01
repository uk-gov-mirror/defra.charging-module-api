ALTER TABLE IF EXISTS bill_runs
DROP COLUMN IF EXISTS approved_for_billing,
DROP COLUMN IF EXISTS approved_for_billing_at,
DROP COLUMN IF EXISTS summary_data,
ALTER COLUMN status SET DEFAULT 'unbilled';
