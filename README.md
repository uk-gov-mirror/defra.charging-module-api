# Charging Module API

![Build Status](https://github.com/DEFRA/charging-module-api/workflows/CI/badge.svg?branch=main)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_charging-module-api&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=DEFRA_charging-module-api)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_charging-module-api&metric=coverage)](https://sonarcloud.io/dashboard?id=DEFRA_charging-module-api)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_charging-module-api&metric=sqale_index)](https://sonarcloud.io/dashboard?id=DEFRA_charging-module-api)
[![Known Vulnerabilities](https://snyk.io/test/github/DEFRA/charging-module-api/badge.svg)](https://snyk.io/test/github/DEFRA/charging-module-api)
[![Licence](https://img.shields.io/badge/Licence-OGLv3-blue.svg)](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3)

This API provides an interface for calculating charges, queuing transactions and generating transaction files used to produce invoices.

## Prerequisites

Make sure you already have:

- [Node.js v12.*](https://nodejs.org/en/)
- [PostgreSQL v10](https://www.postgresql.org/)

## Installation

First clone the repository and then drop into your new local repo

```bash
git clone https://github.com/DEFRA/charging-module-api.git && cd charging-module-api
```

Next download and install the dependencies

```bash
npm install
```

## Configuration

Any configuration is expected to be driven by environment variables when the service is run in production as per [12 factor app](https://12factor.net/config).

However when running locally in development mode or in test it makes use of the [Dotenv](https://github.com/motdotla/dotenv) package. This is a shim that will load values stored in a `.env` file into the environment which the service will then pick up as though they were there all along.

Check out [.env.example](/.env.example) for details of the required things you'll need in your `.env` file.

Refer to [config/config.js](config/config.js) to see all the environment variables that can be set and what their defaults are.

## Databases

First step is to create the databases; one for when running the app normally and one to support the unit tests

```bash
createdb chargedb
createdb chargedb_test
```

Create the required role

```bash
createuser -s charge
```

You then need to run the migrations to update the schema to match what the app expects

```bash
npm run migrate
npm run migrate-test
```

Finally, the [pgcrypto](https://www.postgresql.org/docs/10/pgcrypto.html) extension needs to be added. Having connected to PostgreSQL using [psql](https://www.postgresql.org/docs/10/app-psql.html) run

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Running the app

To run the app use

```bash
npm start
```

To run with live-reload on file updates enabled use

```bash
npm run watch
```

## Testing the app

To run the unit tests use

```bash
npm run unit-test
```

To check the code is written and formatted in a way that meets our [standard](https://github.com/DEFRA/software-development-standards/blob/master/standards/javascript_standards.md) use

```bash
npm run lint
```

## Contributing to this project

If you have an idea you'd like to contribute please log an issue.

All contributions should be submitted via a pull request.

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

>Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
