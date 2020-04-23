const Boom = require('@hapi/boom')
const Joi = require('@hapi/joi')
const { pool } = require('../lib/connectors/db')
const Regime = require('./regime')

class AuthorisedSystem {
  constructor (params) {
    if (params) {
      Object.assign(this, params)
    }
  }

  static async add (params) {
    const { error, value } = this.validate(params)
    if (error) {
      throw Boom.badData(error)
    }

    // will throw if bad values supplied
    const regimes = await this.validateAuthorisations(value.authorisations)

    const exists = await this.exists(value.id)
    if (exists) {
      throw Boom.badData(`System with id '${value.id}' already exists`)
    }

    const stmt = `
      INSERT INTO authorised_systems
      (id, name, status)
      VALUES
      ($1,$2,$3)
      RETURNING id
    `

    const result = await pool.query(stmt, [value.id, value.name, value.status])
    const id = result.rows[0].id

    if (regimes.length > 0) {
      await this.setAuthorisationRegimes(id, regimes)
    }

    return id
  }

  static async exists (systemId) {
    const result = await pool.query('SELECT id FROM authorised_systems WHERE id=$1', [systemId])
    return result.rowCount === 1
  }

  static async assertExists (systemId) {
    const exists = await this.exists(systemId)
    if (!exists) {
      throw Boom.notFound(`No system with id: ${systemId} found`)
    }
    return true
  }

  static async remove (systemId) {
    await this.assertExists(systemId)

    // removes all associated authorisations
    const stmt = `DELETE FROM authorised_systems WHERE id=$1`
    const result = await pool.query(stmt, [systemId])
    return result.rowCount
  }

  static async update (systemId, params) {
    await this.assertExists(systemId)

    const { error, value } = this.validateUpdate(params)
    if (error) {
      throw Boom.badData(error)
    }

    const attrs = []
    const vals = []
    let attrRef = 1

    Object.keys(value).forEach(k => {
      if (k !== 'authorisations') {
        attrs.push(`${k}=$${attrRef++}`)
        vals.push(value[k])
      }
    })

    if (attrs.length > 0) {
      const upd = `
        UPDATE authorised_systems
        SET ${attrs.join(',')}
        WHERE
        id=$${attrRef}
      `
      vals.push(systemId)
      const res1 = await pool.query(upd, vals)
      if (res1.rowCount !== 1) {
        throw Boom.badData('Failed to update record')
      }
    }

    if (value.authorisations) {
      const regimes = await this.validateAuthorisations(value.authorisations)
      await this.setAuthorisationRegimes(systemId, regimes)
    }

    return true
  }

  // returns regime records or throws error
  static async validateAuthorisations (authorisations) {
    const regimes = []
    if (authorisations && authorisations.length > 0) {
      const errors = []
      for (const r of authorisations) {
        const regime = await Regime.findRaw(r)
        if (regime) {
          regimes.push(regime)
        } else {
          errors.push(`Regime '${r}' not found`)
        }
      }
      if (errors.length > 0) {
        throw Boom.badData(errors.join(', '))
      }
    }
    return regimes
  }

  static async setAuthorisationRegimes (systemId, regimes) {
    // fetch current regimes
    const existing = 'SELECT regime_id FROM regime_authorisations WHERE authorised_system_id=$1'
    const exResult = await pool.query(existing, [systemId])

    const curRegs = exResult.rows.map(r => r.regime_id)
    const newRegs = regimes.map(r => r.id)

    // delete existings ones
    const toRemove = curRegs.filter(r => !newRegs.includes(r))
    const toAdd = newRegs.filter(r => !curRegs.includes(r))

    const delStmt = `
      DELETE FROM regime_authorisations
      WHERE authorised_system_id=$1
      AND regime_id=$2
    `
    for (const rId of toRemove) {
      await pool.query(delStmt, [systemId, rId])
    }

    const addStmt = `
      INSERT INTO regime_authorisations
      (authorised_system_id, regime_id)
      VALUES
      ($1,$2)
    `
    for (const rId of toAdd) {
      await pool.query(addStmt, [systemId, rId])
    }
    return true
  }

  static build (params) {
    return new this(params)
  }

  static translate (data) {
    throw new Error('You need to override "translate" in a subclass')
  }

  static async find (systemId, db) {
    const result = await this.findRaw(systemId, db)
    if (result) {
      return this.build(result)
    }
    return null
  }

  static async findRaw (systemId, db) {
    const cnx = db || pool
    const stmt = this.rawQuery + ` WHERE id=$1`
    const result = await cnx.query(stmt, [systemId])
    if (result.rowCount !== 1) {
      return null
    }
    const authSys = result.rows[0]
    // load authorisations
    const stmt2 = `
      SELECT r.slug AS "regime", ra.last_accessed_at
      FROM regime_authorisations ra
      JOIN regimes r
      ON (ra.regime_id = r.id)
      WHERE ra.authorised_system_id=$1
      ORDER BY r.slug ASC
    `
    const auths = await cnx.query(stmt2, [systemId])
    authSys.authorisations = auths.rows
    return authSys
  }

  static async all () {
    const result = await pool.query(this.rawQuery + ' ORDER BY name ASC')
    return result.rows
  }

  static get rawQuery () {
    return 'SELECT * FROM authorised_systems'
  }

  static validate (data) {
    return Joi.validate(data, this.schema, { abortEarly: false })
  }

  static validateUpdate (data) {
    const schema = {
      name: Joi.string(),
      status: Joi.string(),
      authorisations: Joi.array().items(Joi.string())
    }
    return Joi.validate(data, schema, { abortEarly: false })
  }

  static get schema () {
    return {
      id: Joi.string().required(),
      name: Joi.string().required(),
      status: Joi.string().default('active'),
      authorisations: Joi.array().items(Joi.string())
    }
  }
}

module.exports = AuthorisedSystem
