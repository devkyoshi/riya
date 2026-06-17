import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import supertest from 'supertest'
import { buildApp } from '@/app.js'
import { truncateAllTables } from '../../../test/helpers/db.helper.js'
import { createTestUser, getAuthHeader } from '../../../test/helpers/auth.helper.js'
import { users, userRoles } from '@/db/schema/index.js'
import bcrypt from 'bcryptjs'
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

async function createAdminUser() {
  const email = 'admin@test.com'
  const password = 'AdminPass123!'
  const [admin] = await app.db.insert(users).values({
    email, passwordHash: await bcrypt.hash(password, 12), fullName: 'Admin User', isEmailVerified: true,
  }).returning()
  await app.db.insert(userRoles).values({ userId: admin.id, roleKey: 'admin' })

  const res = await supertest(app.server).post('/v1/auth/login').send({ email, password })
  return { token: res.body.accessToken as string, userId: admin.id }
}

describe('GET /v1/admin/features', () => {
  it('admin can list all features', async () => {
    const { token } = await createAdminUser()
    const res = await supertest(app.server).get('/v1/admin/features').set(getAuthHeader(token))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('non-admin gets 403', async () => {
    const user = await createTestUser(app)
    const res = await supertest(app.server).get('/v1/admin/features').set(getAuthHeader(user.accessToken))
    expect(res.status).toBe(403)
  })

  it('unauthenticated gets 401', async () => {
    const res = await supertest(app.server).get('/v1/admin/features')
    expect(res.status).toBe(401)
  })
})

describe('PATCH /v1/admin/features/:key', () => {
  it('admin can disable a feature', async () => {
    const { token } = await createAdminUser()
    const res = await supertest(app.server)
      .patch('/v1/admin/features/document_vault')
      .set(getAuthHeader(token))
      .send({ isEnabled: false })
    expect(res.status).toBe(200)
    expect(res.body.isEnabled).toBe(false)
  })

  it('admin can re-enable a feature', async () => {
    const { token } = await createAdminUser()
    await supertest(app.server).patch('/v1/admin/features/document_vault').set(getAuthHeader(token)).send({ isEnabled: false })
    const res = await supertest(app.server).patch('/v1/admin/features/document_vault').set(getAuthHeader(token)).send({ isEnabled: true })
    expect(res.status).toBe(200)
    expect(res.body.isEnabled).toBe(true)
  })

  it('returns 404 for unknown feature key', async () => {
    const { token } = await createAdminUser()
    const res = await supertest(app.server)
      .patch('/v1/admin/features/nonexistent_feature')
      .set(getAuthHeader(token))
      .send({ isEnabled: false })
    expect(res.status).toBe(404)
  })

  it('non-admin gets 403', async () => {
    const user = await createTestUser(app)
    const res = await supertest(app.server)
      .patch('/v1/admin/features/document_vault')
      .set(getAuthHeader(user.accessToken))
      .send({ isEnabled: false })
    expect(res.status).toBe(403)
  })
})
