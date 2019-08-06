CREATE TABLE IF NOT EXISTS charging.regimes (
    id serial PRIMARY KEY,
    slug VARCHAR(8) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL
);

INSERT INTO charging.regimes (slug, name)
VALUES  ('cfd', 'Water Quality'),
        ('pas', 'Installations'),
        ('wml', 'Waste'),
        ('wrls', 'Water Resources')
;
