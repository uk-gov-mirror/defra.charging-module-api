module.exports = {
  plugin: require('@hapi/good'),
  options: {
    // ops: {
    //   // log ops stats every 30s
    //   interval: 30000
    // },
    reporters: {
      console: [
        {
          module: '@hapi/good-squeeze',
          name: 'Squeeze',
          args: [
            {
              log: '*',
              error: '*',
              response: '*',
              request: '*'
              // ops: '*'
            }
          ]
        },
        {
          module: '@hapi/good-console'
        },
        'stdout'
      ]
    }
  }
}
