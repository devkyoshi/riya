import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import supertest from 'supertest'
import { buildApp } from '@/app.js'
import { truncateAllTables } from '../../../test/helpers/db.helper.js'
import { createTestUser, getAuthHeader } from '../../../test/helpers/auth.helper.js'
import { createTestVehicle } from '../../../test/helpers/vehicle.helper.js'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let token: string
let vehicleId: string

beforeEach(async () => {
  if (!app) {
    app = await buildApp({ testing: true })
    await app.ready()
  }
  await truncateAllTables(app.db)

  const user = await createTestUser(app)
  token = user.accessToken
  const vehicle = await createTestVehicle(app, token)
  vehicleId = vehicle.id
})

afterAll(async () => { await app?.close() })

describe('Service Records', () => {
  const serviceRecord = {
    serviceDate: '2024-01-15',
    mileageKm: 50000,
    description: 'Oil change and filter replacement',
    garageName: 'City Garage',
    totalCost: '8500.00',
    currency: 'LKR',
  }

  it('can create a service record', async () => {
    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicleId}/service-records`)
      .set(getAuthHeader(token))
      .send(serviceRecord)
    expect(res.status).toBe(201)
    expect(res.body.description).toBe(serviceRecord.description)
  })

  it('creates a timeline post on service record creation', async () => {
    await supertest(app.server).post(`/v1/vehicles/${vehicleId}/service-records`).set(getAuthHeader(token)).send(serviceRecord)
    const posts = await app.db.query.timelinePosts.findMany()
    const servicePost = posts.find((p: any) => p.postType === 'service')
    expect(servicePost).toBeDefined()
  })

  it('can list service records ordered by date desc', async () => {
    await supertest(app.server).post(`/v1/vehicles/${vehicleId}/service-records`).set(getAuthHeader(token)).send({ ...serviceRecord, serviceDate: '2024-01-15' })
    await supertest(app.server).post(`/v1/vehicles/${vehicleId}/service-records`).set(getAuthHeader(token)).send({ ...serviceRecord, serviceDate: '2024-06-01' })
    const res = await supertest(app.server).get(`/v1/vehicles/${vehicleId}/service-records`).set(getAuthHeader(token))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].serviceDate >= res.body[1].serviceDate).toBe(true)
  })
})

describe('Insurance Policies', () => {
  const insuranceData = {
    provider: 'Ceylinco Insurance',
    policyNumber: 'CEY-2024-001',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    coverageType: 'comprehensive',
    premiumLkr: '45000.00',
  }

  it('can create an insurance policy', async () => {
    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicleId}/insurance`)
      .set(getAuthHeader(token))
      .send(insuranceData)
    expect(res.status).toBe(201)
    expect(res.body.provider).toBe(insuranceData.provider)
  })

  it('can list insurance policies', async () => {
    await supertest(app.server).post(`/v1/vehicles/${vehicleId}/insurance`).set(getAuthHeader(token)).send(insuranceData)
    const res = await supertest(app.server).get(`/v1/vehicles/${vehicleId}/insurance`).set(getAuthHeader(token))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('Revenue Licenses', () => {
  const licenseData = { issueDate: '2024-01-01', expiryDate: '2024-12-31', feeAmountLkr: '5000.00' }

  it('can create a revenue license', async () => {
    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicleId}/revenue-licenses`)
      .set(getAuthHeader(token))
      .send(licenseData)
    expect(res.status).toBe(201)
    expect(res.body.expiryDate).toBe(licenseData.expiryDate)
  })
})

describe('Emission Tests', () => {
  const testData = { testDate: '2024-03-15', expiryDate: '2025-03-14', testCenter: 'DIMO', result: 'pass' }

  it('can create an emission test', async () => {
    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicleId}/emission-tests`)
      .set(getAuthHeader(token))
      .send(testData)
    expect(res.status).toBe(201)
    expect(res.body.result).toBe('pass')
  })
})
