CREATE TABLE IF NOT EXISTS regimes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(8) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    pre_sroc_cutoff_date date NOT NULL
);

INSERT INTO regimes (slug, name, pre_sroc_cutoff_date)
VALUES  ('cfd', 'Water Quality', '1-APR-2018'),
        ('pas', 'Installations', '1-APR-2018'),
        ('wml', 'Waste', '1-APR-2018'),
        ('wrls', 'Water Resources', '1-APR-2020')
;
