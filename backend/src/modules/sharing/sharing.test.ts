import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import supertest from 'supertest'
import { buildApp } from '@/app.js'
import { truncateAllTables } from '../../../test/helpers/db.helper.js'
import { createTestUser, getAuthHeader } from '../../../test/helpers/auth.helper.js'
import { createTestVehicle } from '../../../test/helpers/vehicle.helper.js'
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

// ─── Share Links ──────────────────────────────────────────────────────────────

describe('POST /v1/vehicles/:id/share-links', () => {
  it('owner can create a share link', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/share-links`)
      .set(getAuthHeader(user.accessToken))
      .send({ label: 'For buyer', expiresInDays: 7 })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(res.body.vehicleId).toBe(vehicle.id)
    expect(res.body.label).toBe('For buyer')
    expect(res.body.isActive).toBe(true)
  })

  it('non-owner gets 403', async () => {
    const user1 = await createTestUser(app)
    const user2 = await createTestUser(app, { email: 'user2@test.com' })
    const vehicle = await createTestVehicle(app, user1.accessToken)

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/share-links`)
      .set(getAuthHeader(user2.accessToken))
      .send({ expiresInDays: 7 })

    expect(res.status).toBe(403)
  })

  it('unauthenticated request returns 401', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)
    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/share-links`)
      .send({ expiresInDays: 7 })
    expect(res.status).toBe(401)
  })
})

describe('GET /v1/vehicles/:id/share-links', () => {
  it('returns list of active share links', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/share-links`)
      .set(getAuthHeader(user.accessToken))
      .send({ label: 'Link 1' })

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/share-links`)
      .set(getAuthHeader(user.accessToken))

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].label).toBe('Link 1')
  })
})

describe('DELETE /v1/vehicles/:id/share-links/:linkId', () => {
  it('owner can revoke a share link', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    const createRes = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/share-links`)
      .set(getAuthHeader(user.accessToken))
      .send({ label: 'Revocable' })

    const linkId = createRes.body.id

    const revokeRes = await supertest(app.server)
      .delete(`/v1/vehicles/${vehicle.id}/share-links/${linkId}`)
      .set(getAuthHeader(user.accessToken))

    expect(revokeRes.status).toBe(204)

    const listRes = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/share-links`)
      .set(getAuthHeader(user.accessToken))

    expect(listRes.body).toHaveLength(0)
  })
})

describe('GET /v1/share/:token (public)', () => {
  it('returns scoped vehicle data for valid token', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    const createRes = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/share-links`)
      .set(getAuthHeader(user.accessToken))
      .send({ label: 'Buyer view', expiresInDays: 7 })

    const token = createRes.body.token

    const res = await supertest(app.server).get(`/v1/share/${token}`)

    expect(res.status).toBe(200)
    expect(res.body.vehicle.id).toBe(vehicle.id)
    expect(res.body.vehicle.plateNumber).toBe(vehicle.plateNumber)
    expect(res.body.shareLink.label).toBe('Buyer view')
    expect(res.body.data).toBeDefined()
  })

  it('returns 404 for unknown token', async () => {
    const res = await supertest(app.server).get('/v1/share/nonexistenttoken123')
    expect(res.status).toBe(404)
  })

  it('single-use link is deactivated after second view', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    const createRes = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/share-links`)
      .set(getAuthHeader(user.accessToken))
      .send({ isSingleUse: true })

    const token = createRes.body.token

    // First view
    const view1 = await supertest(app.server).get(`/v1/share/${token}`)
    expect(view1.status).toBe(200)

    // Second view should be 404 (link deactivated)
    const view2 = await supertest(app.server).get(`/v1/share/${token}`)
    expect(view2.status).toBe(404)
  })
})

// ─── Co-Owners ────────────────────────────────────────────────────────────────

describe('POST /v1/vehicles/:id/co-owners', () => {
  it('owner can add a co-owner by email', async () => {
    const owner = await createTestUser(app)
    const coUser = await createTestUser(app, { email: 'coowner@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/co-owners`)
      .set(getAuthHeader(owner.accessToken))
      .send({ email: 'coowner@test.com', canEdit: true })

    expect(res.status).toBe(201)
    expect(res.body.userId).toBe(coUser.user.id)
    expect(res.body.canEdit).toBe(true)
  })

  it('returns 404 for email not in system', async () => {
    const owner = await createTestUser(app)
    const vehicle = await createTestVehicle(app, owner.accessToken)

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/co-owners`)
      .set(getAuthHeader(owner.accessToken))
      .send({ email: 'nobody@notexist.com' })

    expect(res.status).toBe(404)
  })

  it('returns 409 if already a co-owner', async () => {
    const owner = await createTestUser(app)
    await createTestUser(app, { email: 'coowner2@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/co-owners`)
      .set(getAuthHeader(owner.accessToken))
      .send({ email: 'coowner2@test.com' })

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/co-owners`)
      .set(getAuthHeader(owner.accessToken))
      .send({ email: 'coowner2@test.com' })

    expect(res.status).toBe(409)
  })
})

describe('GET /v1/vehicles/:id/co-owners', () => {
  it('returns list of co-owners', async () => {
    const owner = await createTestUser(app)
    const coUser = await createTestUser(app, { email: 'listed@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/co-owners`)
      .set(getAuthHeader(owner.accessToken))
      .send({ email: 'listed@test.com' })

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/co-owners`)
      .set(getAuthHeader(owner.accessToken))

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].user.email).toBe('listed@test.com')
  })
})

describe('DELETE /v1/vehicles/:id/co-owners/:userId', () => {
  it('owner can remove a co-owner', async () => {
    const owner = await createTestUser(app)
    const coUser = await createTestUser(app, { email: 'todelete@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/co-owners`)
      .set(getAuthHeader(owner.accessToken))
      .send({ email: 'todelete@test.com' })

    const removeRes = await supertest(app.server)
      .delete(`/v1/vehicles/${vehicle.id}/co-owners/${coUser.user.id}`)
      .set(getAuthHeader(owner.accessToken))

    expect(removeRes.status).toBe(204)

    const listRes = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/co-owners`)
      .set(getAuthHeader(owner.accessToken))

    expect(listRes.body).toHaveLength(0)
  })
})
