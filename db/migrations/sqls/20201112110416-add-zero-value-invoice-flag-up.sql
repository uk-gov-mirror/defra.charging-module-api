ALTER TABLE IF EXISTS transactions
ADD COLUMN net_zero_value_invoice BOOLEAN DEFAULT FALSE;
