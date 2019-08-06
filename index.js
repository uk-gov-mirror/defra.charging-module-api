// const config = require('./config/config')
const createServer = require('./app')

createServer()
  .then(server => server.start())
  .catch(err => {
    console.log(err)
    process.exit(1)
  })
