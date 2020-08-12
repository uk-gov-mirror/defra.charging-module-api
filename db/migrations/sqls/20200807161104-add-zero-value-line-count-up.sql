ALTER TABLE IF EXISTS bill_runs
ADD COLUMN zero_value_line_count integer NOT NULL DEFAULT 0;
