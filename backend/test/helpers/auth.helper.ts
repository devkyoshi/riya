import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'

export async function createTestUser(
  app: FastifyInstance,
  overrides: Partial<{ fullName: string; email: string; password: string }> = {},
) {
  const data = {
    fullName: overrides.fullName ?? 'Test User',
    email:    overrides.email    ?? `test_${Date.now()}@example.com`,
    password: overrides.password ?? 'TestPass123!',
  }

  const res = await supertest(app.server)
    .post('/v1/auth/register')
    .send(data)

  if (res.status !== 201) {
    throw new Error(`Failed to create test user: ${JSON.stringify(res.body)}`)
  }

  return { ...res.body, rawPassword: data.password, email: data.email }
}

export async function loginAs(app: FastifyInstance, email: string, password: string) {
  const res = await supertest(app.server)
    .post('/v1/auth/login')
    .send({ email, password })

  if (res.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(res.body)}`)
  }

  return res.body as { accessToken: string; refreshToken: string; user: any }
}

export function getAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` }
}
