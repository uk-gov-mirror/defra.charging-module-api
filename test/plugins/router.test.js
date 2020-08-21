const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code

let server

const handler = function (request, reply) {
  reply('ok')
}

const routes = [
  {
    method: 'GET',
    path: '/allow',
    handler: handler,
    options: {
      tags: ['allow']
    }
  },
  {
    method: 'GET',
    path: '/deny',
    handler: handler,
    options: {
      tags: ['deny']
    }
  },
  {
    method: 'GET',
    path: '/allow-deny',
    handler: handler,
    options: {
      tags: ['allow', 'deny']
    }
  },
  {
    method: 'GET',
    path: '/neither',
    handler: handler,
    options: {
      tags: ['neither']
    }
  }
]

describe('Router plugin', () => {
  beforeEach(async function () {
    server = new Hapi.Server({ port: 8080 })
  })

  afterEach(function () {
    server.stop()
  })

  it('filters routes based on tags', async () => {
    await server.register({
      plugin: require('../../app/plugins/router'),
      options: {
        routes,
        routeTagAllowList: ['allow'],
        routeTagDenyList: ['deny']
      }
    })

    server.start()

    // Check that only the /allow route exists
    expect(serverRoutes(server)).to.equal(['/allow'])
  })
})

function serverRoutes (serverObject) {
  return serverObject.table().map(route => route.path)
}
