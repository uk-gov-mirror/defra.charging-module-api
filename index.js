// const config = require('./config/config')
const createServer = require('./app')

createServer()
  .then(server => server.start())
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
