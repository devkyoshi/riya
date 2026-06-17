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

afterAll(async () => { await app?.close() })

describe('GET /v1/vehicles/:id/timeline', () => {
  it('returns posts ordered by createdAt desc', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/service-records`)
      .set(getAuthHeader(user.accessToken))
      .send({ serviceDate: '2024-01-15', mileageKm: 50000, description: 'Service 1' })

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/service-records`)
      .set(getAuthHeader(user.accessToken))
      .send({ serviceDate: '2024-06-01', mileageKm: 55000, description: 'Service 2' })

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/timeline`)
      .set(getAuthHeader(user.accessToken))

    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(res.body.data.length).toBeGreaterThan(0)

    // Verify descending order
    const timestamps = res.body.data.map((p: any) => new Date(p.createdAt).getTime())
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i])
    }
  })

  it('service record creation auto-creates a timeline post', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/service-records`)
      .set(getAuthHeader(user.accessToken))
      .send({ serviceDate: '2024-01-15', mileageKm: 50000, description: 'Oil change' })

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/timeline`)
      .set(getAuthHeader(user.accessToken))
      .query({ type: 'service' })

    expect(res.status).toBe(200)
    expect(res.body.data.some((p: any) => p.postType === 'service')).toBe(true)
  })

  it('supports pagination', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/timeline`)
      .set(getAuthHeader(user.accessToken))
      .query({ limit: 1, offset: 0 })

    expect(res.status).toBe(200)
    expect(res.body.limit).toBe(1)
    expect(res.body.offset).toBe(0)
  })

  it('returns 403 for non-owner', async () => {
    const user1 = await createTestUser(app)
    const user2 = await createTestUser(app, { email: 'user2@test.com' })
    const vehicle = await createTestVehicle(app, user1.accessToken)

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/timeline`)
      .set(getAuthHeader(user2.accessToken))

    expect(res.status).toBe(403)
  })
})
