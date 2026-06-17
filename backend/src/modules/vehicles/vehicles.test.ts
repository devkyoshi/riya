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

const validVehicle = {
  plateNumber: 'CAB1234',
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  fuelType: 'petrol',
  transmission: 'manual',
  currentMileageKm: 45000,
}

describe('POST /v1/vehicles', () => {
  it('authenticated owner can create vehicle', async () => {
    const user = await createTestUser(app)
    const res = await supertest(app.server)
      .post('/v1/vehicles')
      .set(getAuthHeader(user.accessToken))
      .send(validVehicle)
    expect(res.status).toBe(201)
    expect(res.body.plateNumber).toBe('CAB1234')
    expect(res.body.ownerId).toBe(user.user.id)
  })

  it('creates an ownership_history record', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken, validVehicle)
    const history = await app.db.query.ownershipHistory.findMany()
    expect(history.some((h: any) => h.vehicleId === vehicle.id)).toBe(true)
  })

  it('creates a timeline_post of type ownership_transfer', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken, validVehicle)
    const posts = await app.db.query.timelinePosts.findMany()
    expect(posts.some((p: any) => p.vehicleId === vehicle.id && p.postType === 'ownership_transfer')).toBe(true)
  })

  it('rejects duplicate plate number with 409', async () => {
    const user = await createTestUser(app)
    await createTestVehicle(app, user.accessToken, validVehicle)
    const res = await supertest(app.server)
      .post('/v1/vehicles')
      .set(getAuthHeader(user.accessToken))
      .send(validVehicle)
    expect(res.status).toBe(409)
  })

  it('unauthenticated request returns 401', async () => {
    const res = await supertest(app.server).post('/v1/vehicles').send(validVehicle)
    expect(res.status).toBe(401)
  })
})

describe('GET /v1/vehicles', () => {
  it('returns only vehicles belonging to the authenticated user', async () => {
    const user1 = await createTestUser(app)
    const user2 = await createTestUser(app, { email: 'user2@test.com' })
    await createTestVehicle(app, user1.accessToken)
    await createTestVehicle(app, user2.accessToken)

    const res = await supertest(app.server).get('/v1/vehicles').set(getAuthHeader(user1.accessToken))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].ownerId).toBe(user1.user.id)
  })
})

describe('GET /v1/vehicles/:id', () => {
  it('returns vehicle profile for owner', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)
    const res = await supertest(app.server).get(`/v1/vehicles/${vehicle.id}`).set(getAuthHeader(user.accessToken))
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(vehicle.id)
  })

  it('returns 404 for non-existent vehicle', async () => {
    const user = await createTestUser(app)
    const res = await supertest(app.server)
      .get('/v1/vehicles/00000000-0000-0000-0000-000000000000')
      .set(getAuthHeader(user.accessToken))
    expect(res.status).toBe(404)
  })

  it('returns 403 if requesting user does not own vehicle', async () => {
    const user1 = await createTestUser(app)
    const user2 = await createTestUser(app, { email: 'user2@test.com' })
    const vehicle = await createTestVehicle(app, user1.accessToken)
    const res = await supertest(app.server).get(`/v1/vehicles/${vehicle.id}`).set(getAuthHeader(user2.accessToken))
    expect(res.status).toBe(403)
  })
})

describe('PATCH /v1/vehicles/:id', () => {
  it('owner can update mutable fields', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)
    const res = await supertest(app.server)
      .patch(`/v1/vehicles/${vehicle.id}`)
      .set(getAuthHeader(user.accessToken))
      .send({ color: 'Red', bio: 'My daily driver' })
    expect(res.status).toBe(200)
    expect(res.body.color).toBe('Red')
    expect(res.body.bio).toBe('My daily driver')
  })

  it('non-owner gets 403', async () => {
    const user1 = await createTestUser(app)
    const user2 = await createTestUser(app, { email: 'user2@test.com' })
    const vehicle = await createTestVehicle(app, user1.accessToken)
    const res = await supertest(app.server)
      .patch(`/v1/vehicles/${vehicle.id}`)
      .set(getAuthHeader(user2.accessToken))
      .send({ color: 'Blue' })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /v1/vehicles/:id', () => {
  it('soft-deletes vehicle (is_active=false)', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)
    const deleteRes = await supertest(app.server)
      .delete(`/v1/vehicles/${vehicle.id}`)
      .set(getAuthHeader(user.accessToken))
    expect(deleteRes.status).toBe(204)

    const getRes = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}`)
      .set(getAuthHeader(user.accessToken))
    expect(getRes.status).toBe(404)
  })

  it('non-owner gets 403', async () => {
    const user1 = await createTestUser(app)
    const user2 = await createTestUser(app, { email: 'user2@test.com' })
    const vehicle = await createTestVehicle(app, user1.accessToken)
    const res = await supertest(app.server)
      .delete(`/v1/vehicles/${vehicle.id}`)
      .set(getAuthHeader(user2.accessToken))
    expect(res.status).toBe(403)
  })
})
