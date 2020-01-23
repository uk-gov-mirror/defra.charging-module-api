/* Add summary data (json) and to bill run record */
ALTER TABLE IF EXISTS bill_runs
ALTER COLUMN file_reference TYPE integer USING file_reference::integer,
ADD COLUMN filter json;
