const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const createServer = require('../../app')
const Regime = require('../../app/models/regime')
// const query = require('../../app/services/query/regime')

lab.experiment('Regimes controller test', () => {
  let server
  let regimes
  let mappedRegimes

  // Create server before each test
  lab.before(async () => {
    server = await createServer()
    const result = await Regime.all()
    regimes = result.regimes
    mappedRegimes = regimes // .map(({ slug, name }) => { return { id: slug, name } })
  })

  lab.test('GET /v1/regimes returns regimes', async () => {
    const options = {
      method: 'GET',
      url: '/v1/regimes'
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.headers['content-type']).to.include('application/json')
    Code.expect(JSON.parse(response.payload)).to.equal({ regimes: mappedRegimes })
  })

  lab.test('GET /v1/regimes/{id} returns a regime', async () => {
    for (let i = 0; i < regimes.length; i++) {
      const regime = mappedRegimes[i]
      const options = {
        method: 'GET',
        url: `/v1/regimes/${regime.id}`
      }
      const response = await server.inject(options)
      Code.expect(response.statusCode).to.equal(200)
      Code.expect(response.headers['content-type']).to.include('application/json')
      Code.expect(JSON.parse(response.payload)).to.equal({ regime: regime })
    }
  })

  lab.test('GET /v1/regimes/{id} returns status 404 for invalid id', async () => {
    const options = {
      method: 'GET',
      url: '/v1/regimes/wigwam'
    }
    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(404)
    Code.expect(JSON.parse(response.payload).error).to.equal('Not Found')
  })
})
