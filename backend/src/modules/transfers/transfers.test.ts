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

describe('POST /v1/vehicles/:id/transfer', () => {
  it('owner can initiate a transfer to a valid email', async () => {
    const owner = await createTestUser(app)
    const newOwner = await createTestUser(app, { email: 'newowner@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))
      .send({ toEmail: 'newowner@test.com', transferType: 'purchase', notes: 'Sale agreed' })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe('pending')
    expect(res.body.toEmail).toBe('newowner@test.com')
    expect(res.body.claimToken).toBeTruthy()
  })

  it('returns 409 if a pending transfer already exists', async () => {
    const owner = await createTestUser(app)
    const newOwner = await createTestUser(app, { email: 'buyer2@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))
      .send({ toEmail: 'buyer2@test.com' })

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))
      .send({ toEmail: 'buyer2@test.com' })

    expect(res.status).toBe(409)
  })

  it('non-owner gets 403', async () => {
    const owner = await createTestUser(app)
    const other = await createTestUser(app, { email: 'other@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(other.accessToken))
      .send({ toEmail: 'other@test.com' })

    expect(res.status).toBe(403)
  })
})

describe('POST /v1/transfer/claim/:claimToken', () => {
  it('new owner can claim a transfer and becomes the vehicle owner', async () => {
    const owner = await createTestUser(app)
    const newOwner = await createTestUser(app, { email: 'claim@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    const transferRes = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))
      .send({ toEmail: 'claim@test.com', transferType: 'purchase' })

    const claimToken = transferRes.body.claimToken

    const claimRes = await supertest(app.server)
      .post(`/v1/transfer/claim/${claimToken}`)
      .set(getAuthHeader(newOwner.accessToken))

    expect(claimRes.status).toBe(200)
    expect(claimRes.body.success).toBe(true)

    // Vehicle should now belong to the new owner
    const vehicleCheck = await app.db.query.vehicles.findFirst()
    expect(vehicleCheck?.ownerId).toBe(newOwner.user.id)
  })

  it('returns 403 if claiming user email does not match toEmail', async () => {
    const owner = await createTestUser(app)
    const mismatch = await createTestUser(app, { email: 'mismatch@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    const transferRes = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))
      .send({ toEmail: 'nobody@test.com' })

    const claimToken = transferRes.body.claimToken

    const claimRes = await supertest(app.server)
      .post(`/v1/transfer/claim/${claimToken}`)
      .set(getAuthHeader(mismatch.accessToken))

    expect(claimRes.status).toBe(403)
  })
})

describe('DELETE /v1/vehicles/:id/transfer', () => {
  it('owner can cancel a pending transfer', async () => {
    const owner = await createTestUser(app)
    const buyer = await createTestUser(app, { email: 'buyer3@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))
      .send({ toEmail: 'buyer3@test.com' })

    const cancelRes = await supertest(app.server)
      .delete(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))

    expect(cancelRes.status).toBe(204)

    // Should be able to initiate new transfer after cancel
    const newTransferRes = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))
      .send({ toEmail: 'buyer3@test.com' })

    expect(newTransferRes.status).toBe(201)
  })
})

describe('GET /v1/vehicles/:id/transfer', () => {
  it('returns pending transfer for vehicle', async () => {
    const owner = await createTestUser(app)
    const buyer = await createTestUser(app, { email: 'buyer4@test.com' })
    const vehicle = await createTestVehicle(app, owner.accessToken)

    await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))
      .send({ toEmail: 'buyer4@test.com' })

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('pending')
    expect(res.body.toEmail).toBe('buyer4@test.com')
  })

  it('returns null when no pending transfer', async () => {
    const owner = await createTestUser(app)
    const vehicle = await createTestVehicle(app, owner.accessToken)

    const res = await supertest(app.server)
      .get(`/v1/vehicles/${vehicle.id}/transfer`)
      .set(getAuthHeader(owner.accessToken))

    expect(res.status).toBe(200)
    expect(res.body).toBeNull()
  })
})
