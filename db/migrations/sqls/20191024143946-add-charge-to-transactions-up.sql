/* Add charge value and additional regime specific values */
ALTER TABLE IF EXISTS transactions
ADD COLUMN charge_value integer,
ADD COLUMN regime_value_16 varchar,
ADD COLUMN regime_value_17 varchar,
ADD COLUMN regime_value_18 varchar,
ADD COLUMN regime_value_19 varchar,
ADD COLUMN regime_value_20 varchar;
