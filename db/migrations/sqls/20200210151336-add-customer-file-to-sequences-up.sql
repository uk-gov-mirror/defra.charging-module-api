ALTER TABLE IF EXISTS sequence_counters
ADD COLUMN customer_file_number integer NOT NULL DEFAULT 0;
