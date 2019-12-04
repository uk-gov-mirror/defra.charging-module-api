/* Add charge value and additional regime specific values */
ALTER TABLE IF EXISTS transactions
ADD COLUMN bill_run integer;
