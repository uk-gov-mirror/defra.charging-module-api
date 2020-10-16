require('dotenv').config()
const joi = require('@hapi/joi')
const environment = process.env.NODE_ENV || 'development'

const config = {
  environment: {
    name: environment,
    development: environment === 'development',
    test: environment === 'test',
    production: environment === 'production',
    serviceUrl: process.env.SERVICE_URL
  },

  adminClientId: process.env.ADMIN_CLIENT_ID,

  fileExportSchedule: process.env.FILE_EXPORT_SCHEDULE, // '*/1 * * * *', // every minute for testing
  customerFileExportSchedule: process.env.CUSTOMER_FILE_EXPORT_SCHEDULE, // '*/1 * * * *', // every minute for testing
  temporaryFilePath: process.env.TMPDIR,
  removeTemporaryFiles: process.env.REMOVE_TMP_FILES,

  minimumChargeAmount: 2500,

  server: {
    port: process.env.PORT,
    router: {
      isCaseSensitive: false,
      stripTrailingSlash: true
    },
    // The routes section is used to set default configuration for every route
    // in the app.
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      // Have Hapi set a bunch of common security headers. See
      // https://hapi.dev/api/?v=20.0.0#-routeoptionssecurity for details of
      // what gets enabled
      security: true
    }
  },

  db: {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    connectionTimeoutMillis: 2000,
    idleTimeoutMillis: 30000,
    max: 10
  },

  pagination: {
    page: 1,
    perPage: 50,
    maxPerPage: 100
  },

  s3: {
    upload: {
      service: process.env.UPLOAD_BUCKET,
      options: {
        region: 'eu-west-1',
        accessKeyId: process.env.UPLOAD_ACCESS_KEY,
        secretAccessKey: process.env.UPLOAD_SECRET_KEY
      }
    },
    archive: {
      service: process.env.ARCHIVE_BUCKET,
      options: {
        region: 'eu-west-1',
        accessKeyId: process.env.ARCHIVE_ACCESS_KEY,
        secretAccessKey: process.env.ARCHIVE_SECRET_KEY
      }
    }
  },

  airbrake: {
    host: process.env.AIRBRAKE_HOST,
    projectKey: process.env.AIRBRAKE_KEY,
    projectId: 1
  },

  decisionService: {
    url: process.env.DECISION_SERVICE_URL,
    username: process.env.DECISION_SERVICE_USER,
    password: process.env.DECISION_SERVICE_PASSWORD,
    endpoints: {
      cfd: {
        application: process.env.CFD_APP,
        ruleset: process.env.CFD_RULESET
      },
      pas: {
        application: process.env.PAS_APP,
        ruleset: process.env.PAS_RULESET
      },
      wml: {
        application: process.env.WML_APP,
        ruleset: process.env.WML_RULESET
      },
      wrls: {
        application: process.env.WRLS_APP,
        ruleset: process.env.WRLS_RULESET
      }
    }
  },
  billRunSummaryTimeout: process.env.BILL_RUN_SUMMARY_TIMEOUT
}

// Define config schema

const bucketSchema = joi.object({
  service: joi.string(),
  options: joi.object({
    region: joi.string(),
    accessKeyId: joi.string(),
    secretAccessKey: joi.string()
  })
})

const schema = {
  environment: joi.object({
    name: joi.string().valid('development', 'test', 'production').default('development'),
    development: joi.boolean().default(true),
    test: joi.boolean().default(false),
    production: joi.boolean().default(false),
    serviceUrl: joi.string().required()
  }),
  adminClientId: joi.string().required(),
  fileExportSchedule: joi.string().default('0,30 * * * *'), // default every 30 mins (on the hour and half past)
  customerFileExportSchedule: joi.string().default('0 1 * * 6'), // default 01:00 on Saturday
  temporaryFilePath: joi.string().default('/tmp/'),
  removeTemporaryFiles: joi.boolean().default(true),
  minimumChargeAmount: joi.number().required(),
  server: joi.object({
    port: joi.number().default(3000).required(),
    router: joi.object({
      isCaseSensitive: joi.boolean().default(false),
      stripTrailingSlash: joi.boolean().default(true)
    }).optional(),
    routes: joi.optional()
  }),
  db: joi.object({
    host: joi.string().required(),
    port: joi.number().default(5432).required(),
    database: joi.string().required(),
    user: joi.string().required(),
    password: joi.string().required(),
    connectionTimeoutMillis: joi.number().default(2000),
    idleTimeoutMillis: joi.number().default(30000),
    max: joi.number().default(10)
  }),
  pagination: joi.object({
    page: joi.number().default(1),
    perPage: joi.number().default(50),
    maxPerPage: joi.number().default(100)
  }),
  s3: joi.object({
    upload: bucketSchema,
    archive: bucketSchema
  }),
  airbrake: joi.object({
    host: joi.string().required(),
    projectKey: joi.string().required(),
    projectId: joi.number().required()
  }),
  decisionService: joi.object({
    url: joi.string().required(),
    username: joi.string().required(),
    password: joi.string().required(),
    endpoints: joi.object({
      cfd: {
        application: joi.string().required(),
        ruleset: joi.string().required()
      },
      pas: {
        application: joi.string().required(),
        ruleset: joi.string().required()
      },
      wml: {
        application: joi.string().required(),
        ruleset: joi.string().required()
      },
      wrls: {
        application: joi.string().required(),
        ruleset: joi.string().required()
      }
    })
  }),
  billRunSummaryTimeout: joi.number().required()
}

// Validate config
const result = joi.validate(config, schema, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

// Use the joi validated value
module.exports = result.value
