const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const { describe, it, before } = exports.lab = Lab.script()
const { expect } = Code
const { createToken, createAdminToken, addAuthorisedSystem, cleanAuthorisedSystems } = require('../helpers/authorisation_helper')
const Authorisation = require('../../app/lib/authorisation')
const Regime = require('../../app/models/regime')

describe('Authorisation.assertAuthorisedForRegime', async () => {
  let regime

  before(async () => {
    await cleanAuthorisedSystems()
    await addAuthorisedSystem('wrlskey', ['wrls'])
    regime = await Regime.find('wrls')
  })

  it('rejects invalid tokens', async () => {
    await expect(Authorisation.assertAuthorisedForRegime('wrls', 'bearer banana.egg.peanut')).to.reject(Error, 'Invalid token')
    await expect(Authorisation.assertAuthorisedForRegime('wrls', 'bearer')).to.reject(Error, 'Invalid token')
    await expect(Authorisation.assertAuthorisedForRegime('wrls')).to.reject(Error, 'Invalid token')
  })

  it('returns a regime object when authorised', async () => {
    const token = `bearer ${createToken('wrlskey')}`
    const reg = await Authorisation.assertAuthorisedForRegime('wrls', token)
    expect(reg.id).to.equal(regime.id)
  })

  it('always permits access to the admin token', async () => {
    const token = `bearer ${createAdminToken()}`
    const reg = await Authorisation.assertAuthorisedForRegime('wrls', token)
    expect(reg.id).to.equal(regime.id)
  })

  it('rejects tokens that are not authorised for the requested regime', async () => {
    const token = `bearer ${createToken('anotherkey')}`
    await expect(Authorisation.assertAuthorisedForRegime('wrls', token)).to.reject(Error, 'Unauthorised for regime \'wrls\'')
  })
})

describe('Authorisation.assertAdminOnlyAccess', async () => {
  it('rejects invalid tokens', () => {
    expect(Authorisation.assertAdminOnlyAccess.bind(Authorisation, 'foo')).to.throw(Error, 'Invalid token')
    expect(Authorisation.assertAdminOnlyAccess.bind(Authorisation, 'bearer banana.egg.peanut')).to.throw(Error, 'Invalid token')
    expect(Authorisation.assertAdminOnlyAccess.bind(Authorisation, 'bearer')).to.throw(Error, 'Invalid token')
    expect(Authorisation.assertAdminOnlyAccess.bind(Authorisation)).to.throw(Error, 'Invalid token')
  })

  it('returns true when token represents admin user', () => {
    const token = `bearer ${createAdminToken()}`
    expect(Authorisation.assertAdminOnlyAccess(token)).to.be.true()
  })
})
