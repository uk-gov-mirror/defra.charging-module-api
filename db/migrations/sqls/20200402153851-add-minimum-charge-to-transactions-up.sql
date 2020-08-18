/* Add minimum charge flags */
ALTER TABLE IF EXISTS transactions
ADD COLUMN new_licence boolean NOT NULL DEFAULT false,
ADD COLUMN minimum_charge_adjustment boolean NOT NULL DEFAULT false;
