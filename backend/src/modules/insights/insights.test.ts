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

describe('POST /v1/vehicles/:id/mileage', () => {
  it('owner can log a mileage entry', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken, { currentMileageKm: 40000 })

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/mileage`)
      .set(getAuthHeader(user.accessToken))
      .send({ mileageKm: 42000, recordedAt: '2025-01-15', source: 'manual' })

    expect(res.status).toBe(201)
    expect(res.body.mileageKm).toBe(42000)
    expect(res.body.vehicleId).toBe(vehicle.id)
  })

  it('non-owner gets 403', async () => {
    const user1 = await createTestUser(app)
    const user2 = await createTestUser(app, { email: 'other@test.com' })
    const vehicle = await createTestVehicle(app, user1.accessToken)

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/mileage`)
      .set(getAuthHeader(user2.accessToken))
      .send({ mileageKm: 10000, recordedAt: '2025-01-15' })

    expect(res.status).toBe(403)
  })
})

describe('GET /v1/vehicles/:id/mileage', () => {
  it('returns mileage history in descending order', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/mileage`)
      .set(getAuthHeader(user.accessToken))
      .send({ mileageKm: 10000, recordedAt: '2025-01-01' })

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/mileage`)
      .set(getAuthHeader(user.accessToken))
      .send({ mileageKm: 12000, recordedAt: '2025-03-01' })

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/mileage`)
      .set(getAuthHeader(user.accessToken))

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].mileageKm).toBe(12000)
  })
})

describe('GET /v1/vehicles/:id/health-score', () => {
  it('returns a health score with grade and factors', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken, {
      year: 2022,
      currentMileageKm: 20000,
      condition: 'excellent',
    })

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/health-score`)
      .set(getAuthHeader(user.accessToken))

    expect(res.status).toBe(200)
    expect(res.body.score).toBeGreaterThanOrEqual(0)
    expect(res.body.score).toBeLessThanOrEqual(100)
    expect(['A', 'B', 'C', 'D', 'F']).toContain(res.body.grade)
    expect(res.body.factors).toBeDefined()
  })

  it('non-owner gets 403', async () => {
    const user1 = await createTestUser(app)
    const user2 = await createTestUser(app, { email: 'other2@test.com' })
    const vehicle = await createTestVehicle(app, user1.accessToken)

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/health-score`)
      .set(getAuthHeader(user2.accessToken))

    expect(res.status).toBe(403)
  })
})

describe('GET /v1/vehicles/:id/valuation', () => {
  it('returns a valuation estimate with min/max range', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken, {
      make: 'Toyota',
      year: 2020,
      currentMileageKm: 50000,
    })

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/valuation`)
      .set(getAuthHeader(user.accessToken))

    expect(res.status).toBe(200)
    expect(res.body.estimatedValueLkr).toBeGreaterThan(0)
    expect(res.body.minValueLkr).toBeLessThanOrEqual(res.body.estimatedValueLkr)
    expect(res.body.maxValueLkr).toBeGreaterThanOrEqual(res.body.estimatedValueLkr)
    expect(res.body.factors.make).toBe('Toyota')
  })
})

describe('GET /v1/vehicles/:id/maintenance-schedule', () => {
  it('returns a maintenance schedule with service intervals', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken, { currentMileageKm: 30000 })

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/maintenance-schedule`)
      .set(getAuthHeader(user.accessToken))

    expect(res.status).toBe(200)
    expect(res.body.schedule).toBeInstanceOf(Array)
    expect(res.body.schedule.length).toBeGreaterThan(0)
    expect(res.body.schedule[0].type).toBeDefined()
    expect(['ok', 'due_soon', 'overdue']).toContain(res.body.schedule[0].status)
  })
})

describe('POST /v1/vehicles/:id/fraud-check', () => {
  it('detects odometer rollback in mileage log', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken, { currentMileageKm: 50000 })

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/mileage`)
      .set(getAuthHeader(user.accessToken))
      .send({ mileageKm: 50000, recordedAt: '2025-01-01' })

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/mileage`)
      .set(getAuthHeader(user.accessToken))
      .send({ mileageKm: 45000, recordedAt: '2025-06-01' })

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/fraud-check`)
      .set(getAuthHeader(user.accessToken))

    expect(res.status).toBe(200)
    expect(res.body.flagsFound).toBe(1)
    expect(res.body.flags[0].type).toBe('odometer_rollback')
    expect(res.body.flags[0].severity).toBe('high')
  })

  it('no flags on clean mileage log', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken, { currentMileageKm: 30000 })

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/mileage`)
      .set(getAuthHeader(user.accessToken))
      .send({ mileageKm: 30000, recordedAt: '2025-01-01' })

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/mileage`)
      .set(getAuthHeader(user.accessToken))
      .send({ mileageKm: 32000, recordedAt: '2025-06-01' })

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/fraud-check`)
      .set(getAuthHeader(user.accessToken))

    expect(res.status).toBe(200)
    expect(res.body.flagsFound).toBe(0)
  })
})
