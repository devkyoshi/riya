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

const garageData = {
  type: 'garage' as const,
  businessName: 'Super Fix Garage',
  registrationNumber: 'BR-123456',
  address: '45 Galle Rd, Colombo',
  contactPhone: '+94771234567',
  contactEmail: 'garage@superfix.lk',
}

describe('POST /v1/partner/register', () => {
  it('user can register as a garage', async () => {
    const user = await createTestUser(app)

    const res = await supertest(app.server)
      .post('/v1/partner/register')
      .set(getAuthHeader(user.accessToken))
      .send(garageData)

    expect(res.status).toBe(201)
    expect(res.body.businessName).toBe('Super Fix Garage')
    expect(res.body.type).toBe('garage')
    expect(res.body.isVerified).toBe(false)
  })

  it('returns 409 if user already has a business account', async () => {
    const user = await createTestUser(app)

    await supertest(app.server)
      .post('/v1/partner/register')
      .set(getAuthHeader(user.accessToken))
      .send(garageData)

    const res = await supertest(app.server)
      .post('/v1/partner/register')
      .set(getAuthHeader(user.accessToken))
      .send({ type: 'insurer', businessName: 'Another Business' })

    expect(res.status).toBe(409)
  })

  it('unauthenticated returns 401', async () => {
    const res = await supertest(app.server)
      .post('/v1/partner/register')
      .send(garageData)
    expect(res.status).toBe(401)
  })
})

describe('GET /v1/partner/profile', () => {
  it('returns the business account profile', async () => {
    const user = await createTestUser(app)

    await supertest(app.server)
      .post('/v1/partner/register')
      .set(getAuthHeader(user.accessToken))
      .send(garageData)

    const res = await supertest(app.server)
      .get('/v1/partner/profile')
      .set(getAuthHeader(user.accessToken))

    expect(res.status).toBe(200)
    expect(res.body.businessName).toBe('Super Fix Garage')
  })

  it('returns 404 if no business account registered', async () => {
    const user = await createTestUser(app)
    const res = await supertest(app.server)
      .get('/v1/partner/profile')
      .set(getAuthHeader(user.accessToken))
    expect(res.status).toBe(404)
  })
})

describe('POST /v1/partner/service-records', () => {
  it('garage partner can submit a verified service record', async () => {
    const vehicleOwner = await createTestUser(app)
    const garageUser = await createTestUser(app, { email: 'garage@test.com' })
    const vehicle = await createTestVehicle(app, vehicleOwner.accessToken)

    await supertest(app.server)
      .post('/v1/partner/register')
      .set(getAuthHeader(garageUser.accessToken))
      .send(garageData)

    const res = await supertest(app.server)
      .post('/v1/partner/service-records')
      .set(getAuthHeader(garageUser.accessToken))
      .send({
        vehiclePlate: vehicle.plateNumber,
        serviceDate: '2025-06-01',
        mileageKm: 55000,
        description: 'Full service + oil change',
        totalCost: '15000',
      })

    expect(res.status).toBe(201)
    expect(res.body.isVerified).toBe(true)
    expect(res.body.garageName).toBe('Super Fix Garage')
    expect(res.body.vehicleId).toBe(vehicle.id)
  })

  it('returns 404 for unknown vehicle plate', async () => {
    const garageUser = await createTestUser(app, { email: 'g2@test.com' })

    await supertest(app.server)
      .post('/v1/partner/register')
      .set(getAuthHeader(garageUser.accessToken))
      .send(garageData)

    const res = await supertest(app.server)
      .post('/v1/partner/service-records')
      .set(getAuthHeader(garageUser.accessToken))
      .send({
        vehiclePlate: 'ZZZNOTEXIST',
        serviceDate: '2025-06-01',
        mileageKm: 5000,
        description: 'Oil change',
      })

    expect(res.status).toBe(404)
  })

  it('non-garage user gets 403', async () => {
    const vehicleOwner = await createTestUser(app)
    const plainUser = await createTestUser(app, { email: 'plain@test.com' })
    const vehicle = await createTestVehicle(app, vehicleOwner.accessToken)

    const res = await supertest(app.server)
      .post('/v1/partner/service-records')
      .set(getAuthHeader(plainUser.accessToken))
      .send({
        vehiclePlate: vehicle.plateNumber,
        serviceDate: '2025-06-01',
        mileageKm: 5000,
        description: 'Oil change',
      })

    expect(res.status).toBe(403)
  })
})

describe('POST /v1/partner/insurance', () => {
  it('insurer partner can submit an insurance policy', async () => {
    const vehicleOwner = await createTestUser(app)
    const insurerUser = await createTestUser(app, { email: 'insurer@test.com' })
    const vehicle = await createTestVehicle(app, vehicleOwner.accessToken)

    await supertest(app.server)
      .post('/v1/partner/register')
      .set(getAuthHeader(insurerUser.accessToken))
      .send({ type: 'insurer', businessName: 'SL Insurance Co', contactEmail: 'info@slins.lk' })

    const res = await supertest(app.server)
      .post('/v1/partner/insurance')
      .set(getAuthHeader(insurerUser.accessToken))
      .send({
        vehiclePlate: vehicle.plateNumber,
        policyNumber: 'POL-2025-001',
        coverageType: 'comprehensive',
        startDate: '2025-01-01',
        endDate: '2026-01-01',
        premiumLkr: '95000',
      })

    expect(res.status).toBe(201)
    expect(res.body.policyNumber).toBe('POL-2025-001')
    expect(res.body.provider).toBe('SL Insurance Co')
  })

  it('non-insurer gets 403', async () => {
    const vehicleOwner = await createTestUser(app)
    const garageUser = await createTestUser(app, { email: 'gonly@test.com' })
    const vehicle = await createTestVehicle(app, vehicleOwner.accessToken)

    await supertest(app.server)
      .post('/v1/partner/register')
      .set(getAuthHeader(garageUser.accessToken))
      .send(garageData)

    const res = await supertest(app.server)
      .post('/v1/partner/insurance')
      .set(getAuthHeader(garageUser.accessToken))
      .send({
        vehiclePlate: vehicle.plateNumber,
        policyNumber: 'POL-BAD',
        startDate: '2025-01-01',
        endDate: '2026-01-01',
      })

    expect(res.status).toBe(403)
  })
})

describe('GET /v1/partner/submissions', () => {
  it('garage partner sees their submitted service records', async () => {
    const vehicleOwner = await createTestUser(app)
    const garageUser = await createTestUser(app, { email: 'garage_sub@test.com' })
    const vehicle = await createTestVehicle(app, vehicleOwner.accessToken)

    await supertest(app.server)
      .post('/v1/partner/register')
      .set(getAuthHeader(garageUser.accessToken))
      .send(garageData)

    await supertest(app.server)
      .post('/v1/partner/service-records')
      .set(getAuthHeader(garageUser.accessToken))
      .send({ vehiclePlate: vehicle.plateNumber, serviceDate: '2025-06-01', mileageKm: 5000, description: 'Tyre rotation' })

    const res = await supertest(app.server)
      .get('/v1/partner/submissions')
      .set(getAuthHeader(garageUser.accessToken))

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].description).toBe('Tyre rotation')
  })
})
