ALTER TABLE IF EXISTS bill_runs
ADD COLUMN transaction_filename varchar;

UPDATE bill_runs SET transaction_filename=LOWER(CONCAT('nal', region, 'i', file_reference::varchar, '.dat'));
