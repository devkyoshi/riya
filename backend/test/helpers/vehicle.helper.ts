import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { getAuthHeader } from './auth.helper.js'

export async function createTestVehicle(app: FastifyInstance, token: string, overrides: Record<string, any> = {}) {
  const data = {
    plateNumber:      overrides.plateNumber ?? `LK${Date.now().toString().slice(-5)}`,
    make:             overrides.make        ?? 'Toyota',
    model:            overrides.model       ?? 'Corolla',
    year:             overrides.year        ?? 2020,
    fuelType:         overrides.fuelType    ?? 'petrol',
    transmission:     overrides.transmission ?? 'manual',
    currentMileageKm: overrides.currentMileageKm ?? 50000,
    ...overrides,
  }

  const res = await supertest(app.server)
    .post('/v1/vehicles')
    .set(getAuthHeader(token))
    .send(data)

  if (res.status !== 201) {
    throw new Error(`Failed to create test vehicle: ${JSON.stringify(res.body)}`)
  }

  return res.body
}
