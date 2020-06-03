# Charging Module API
This API provides an interface for calculating charges, queuing
transactions and generating transaction files used to produce
invoices.

## Environment variables
| name     | description      | required | default |            valid            | notes |
|----------|------------------|:--------:|---------|:---------------------------:|-------|
| NODE_ENV | Node environment |    no    |         | development,test,production |       |
| PORT     | Port number      |    no    | 3000    |                             |       |
| PGHOST   | Postgres host address |  yes  | | FQDN or IP address | |
| PGUSER   | Postgres user | yes | |  | |
| PGPASSWORD | Postgres user password | yes | | | |
| PGDATABASE | Postgres database name | yes | | | |
| PGPORT | Postgres port number | no | 5432 | | |

## Prerequisites

Node v10+

Two (PostgreSQL) databases nameed `chargedb` and `chargedb_test`,
each with `pgcrypto` enabled.

## Setup

The following commands will set up the required local development
and test databases:

```bash
$ createdb chargedb && createdb chargedb_test
$ npm run migrate && npm run migrate-test
```

## Running the application

```bash
$ npm start
```


Run with live-reload on file updates:

```
npm run watch
```

Run tests:

```
npm run migrate-test

npm test
```

## DB and Migrations

Enable `pgcrypto`, in psql:
```
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
