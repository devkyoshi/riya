import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import supertest from 'supertest'
import { buildApp } from '@/app.js'
import { truncateAllTables } from '../../../test/helpers/db.helper.js'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeEach(async () => {
  if (!app) {
    app = await buildApp({ testing: true })
    await app.ready()
  }
  await truncateAllTables(app.db)
})

afterAll(async () => {
  await app?.close()
})

const validUser = {
  fullName: 'John Perera',
  email: 'john@example.com',
  password: 'SecurePass123!',
}

describe('POST /v1/auth/register', () => {
  it('creates user and returns access + refresh tokens', async () => {
    const res = await supertest(app.server).post('/v1/auth/register').send(validUser)
    expect(res.status).toBe(201)
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.refreshToken).toBeDefined()
    expect(res.body.user.email).toBe(validUser.email)
    expect(res.body.user.roles).toContain('owner')
  })

  it('rejects duplicate email with 409', async () => {
    await supertest(app.server).post('/v1/auth/register').send(validUser)
    const res = await supertest(app.server).post('/v1/auth/register').send(validUser)
    expect(res.status).toBe(409)
  })

  it('rejects invalid email format with 400', async () => {
    const res = await supertest(app.server).post('/v1/auth/register').send({ ...validUser, email: 'not-an-email' })
    expect(res.status).toBe(400)
  })

  it('rejects password shorter than 8 chars with 400', async () => {
    const res = await supertest(app.server).post('/v1/auth/register').send({ ...validUser, password: 'short' })
    expect(res.status).toBe(400)
  })
})

describe('POST /v1/auth/login', () => {
  beforeEach(async () => {
    await supertest(app.server).post('/v1/auth/register').send(validUser)
  })

  it('returns tokens for valid credentials', async () => {
    const res = await supertest(app.server).post('/v1/auth/login').send({
      email: validUser.email, password: validUser.password,
    })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.refreshToken).toBeDefined()
  })

  it('returns 401 for wrong password', async () => {
    const res = await supertest(app.server).post('/v1/auth/login').send({
      email: validUser.email, password: 'WrongPassword!',
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 for unknown email', async () => {
    const res = await supertest(app.server).post('/v1/auth/login').send({
      email: 'unknown@example.com', password: validUser.password,
    })
    expect(res.status).toBe(401)
  })

  it('both 401 responses have same message (no email enumeration)', async () => {
    const wrongPass = await supertest(app.server).post('/v1/auth/login').send({ email: validUser.email, password: 'wrong' })
    const unknownEmail = await supertest(app.server).post('/v1/auth/login').send({ email: 'x@y.com', password: 'wrong' })
    expect(wrongPass.body.message).toBe(unknownEmail.body.message)
  })
})

describe('POST /v1/auth/refresh', () => {
  it('issues new access + refresh token pair', async () => {
    const reg = await supertest(app.server).post('/v1/auth/register').send(validUser)
    const res = await supertest(app.server).post('/v1/auth/refresh').send({ refreshToken: reg.body.refreshToken })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.refreshToken).toBeDefined()
    expect(res.body.refreshToken).not.toBe(reg.body.refreshToken)
  })

  it('rejects already-used refresh token (replay attack)', async () => {
    const reg = await supertest(app.server).post('/v1/auth/register').send(validUser)
    await supertest(app.server).post('/v1/auth/refresh').send({ refreshToken: reg.body.refreshToken })
    const res = await supertest(app.server).post('/v1/auth/refresh').send({ refreshToken: reg.body.refreshToken })
    expect(res.status).toBe(401)
  })

  it('rejects invalid refresh token', async () => {
    const res = await supertest(app.server).post('/v1/auth/refresh').send({ refreshToken: 'invalid-token' })
    expect(res.status).toBe(401)
  })
})

describe('POST /v1/auth/logout', () => {
  it('returns 204 and revokes the refresh token', async () => {
    const reg = await supertest(app.server).post('/v1/auth/register').send(validUser)
    const res = await supertest(app.server).post('/v1/auth/logout').send({ refreshToken: reg.body.refreshToken })
    expect(res.status).toBe(204)

    // Token should be invalidated after logout
    const refresh = await supertest(app.server).post('/v1/auth/refresh').send({ refreshToken: reg.body.refreshToken })
    expect(refresh.status).toBe(401)
  })
})

describe('GET /v1/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await supertest(app.server).get('/v1/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.timestamp).toBeDefined()
  })
})
