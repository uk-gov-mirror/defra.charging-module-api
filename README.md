# Charging Module API
This API provides an interface for calculating charges, queuing transactions and generating transaction files used to produce invoices.

# Environment variables
| name     | description      | required | default |            valid            | notes |
|----------|------------------|:--------:|---------|:---------------------------:|-------|
| NODE_ENV | Node environment |    no    |         | development,test,production |       |
| PORT     | Port number      |    no    | 3000    |                             |       |
| PGHOST   | Postgres host address |  yes  | | FQDN or IP address | |
| PGUSER   | Postgres user | yes | |  | |
| PGPASSWORD | Postgres user password | yes | | | |
| PGDATABASE | Postgres database name | yes | | | |
| PGPORT | Postgres port number | no | 5432 | | |

# Prerequisites

Node v8+

# Running the application

`$ node index.js`

