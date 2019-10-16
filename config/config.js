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

  server: {
    port: process.env.PORT,
    router: {
      isCaseSensitive: false,
      stripTrailingSlash: true
    },
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
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
    perPage: 10
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
  }
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
    perPage: joi.number().default(10)
  }),
  s3: joi.object({
    upload: bucketSchema,
    archive: bucketSchema
  }),
  airbrake: joi.object({
    host: joi.string().required(),
    projectKey: joi.string().required(),
    projectId: joi.number().required()
  })
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
