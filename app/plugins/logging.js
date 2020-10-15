module.exports = {
  plugin: require('@hapi/good'),
  options: {
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
