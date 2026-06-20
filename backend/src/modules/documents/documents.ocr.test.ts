import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import supertest from 'supertest'
import { buildApp } from '@/app.js'
import { truncateAllTables } from '../../../test/helpers/db.helper.js'
import { createTestUser, getAuthHeader } from '../../../test/helpers/auth.helper.js'
import { createTestVehicle } from '../../../test/helpers/vehicle.helper.js'
import { documents } from '@/db/schema/index.js'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

// Prevent OCR dispatch from making real HTTP calls during tests
vi.mock('./ocr.client.js', () => ({
  isOcrEligible: (type: string) =>
    ['revenue_license', 'registration_certificate', 'emission_test', 'insurance_policy', 'service_receipt'].includes(type),
  dispatchOcrJob: vi.fn(), // no-op
}))

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

// ─── Upload: OCR status on creation ──────────────────────────────────────────

describe('POST /v1/vehicles/:id/documents — OCR status', () => {
  it('OCR-eligible document type gets ocrStatus=pending on upload', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/documents`)
      .set(getAuthHeader(user.accessToken))
      .query({ documentType: 'revenue_license', title: 'Revenue License 2024' })
      .attach('file', Buffer.from('fake-pdf-content'), { filename: 'rl.pdf', contentType: 'application/pdf' })

    expect(res.status).toBe(201)
    expect(res.body.ocrStatus).toBe('pending')
  })

  it('non-eligible document type gets ocrStatus=skipped', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    const res = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/documents`)
      .set(getAuthHeader(user.accessToken))
      .query({ documentType: 'other', title: 'Random Doc' })
      .attach('file', Buffer.from('content'), { filename: 'doc.pdf', contentType: 'application/pdf' })

    expect(res.status).toBe(201)
    expect(res.body.ocrStatus).toBe('skipped')
  })
})

// ─── Internal OCR callback ────────────────────────────────────────────────────

describe('PATCH /v1/internal/documents/:id/ocr-result', () => {
  async function createDoc(app: FastifyInstance, vehicleId: string, userId: string) {
    const [doc] = await app.db.insert(documents).values({
      vehicleId,
      uploadedBy: userId,
      documentType: 'revenue_license' as any,
      title: 'Test RL',
      fileUrl: '/uploads/test.pdf',
      fileKey: 'test.pdf',
      ocrStatus: 'pending' as any,
    }).returning()
    return doc
  }

  it('updates ocrStatus and extractedFields on completed callback', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)
    const doc = await createDoc(app, vehicle.id, user.user.id)

    const fields = {
      plateNumber: { value: 'CAB-1234', confidence: 0.97 },
      expiresAt: { value: '2025-09-30', confidence: 0.92 },
    }

    const res = await supertest(app.server)
      .patch(`/v1/internal/documents/${doc.id}/ocr-result`)
      .set('x-internal-secret', 'dev-internal-secret')
      .send({ ocrStatus: 'completed', extractedFields: fields })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const updated = await app.db.query.documents.findFirst({ where: eq(documents.id, doc.id) })
    expect(updated?.ocrStatus).toBe('completed')
    expect((updated?.extractedFields as any)?.plateNumber?.value).toBe('CAB-1234')
  })

  it('rejects callback without valid internal secret', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)
    const doc = await createDoc(app, vehicle.id, user.user.id)

    const res = await supertest(app.server)
      .patch(`/v1/internal/documents/${doc.id}/ocr-result`)
      .set('x-internal-secret', 'wrong-secret')
      .send({ ocrStatus: 'completed', extractedFields: {} })

    expect(res.status).toBe(401)
  })

  it('handles failed OCR status', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)
    const doc = await createDoc(app, vehicle.id, user.user.id)

    const res = await supertest(app.server)
      .patch(`/v1/internal/documents/${doc.id}/ocr-result`)
      .set('x-internal-secret', 'dev-internal-secret')
      .send({ ocrStatus: 'failed' })

    expect(res.status).toBe(200)

    const updated = await app.db.query.documents.findFirst({ where: eq(documents.id, doc.id) })
    expect(updated?.ocrStatus).toBe('failed')
  })

  it('auto-upserts revenue_licenses row when revenue_license completed with expiry + issue date', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)
    const doc = await createDoc(app, vehicle.id, user.user.id)

    const res = await supertest(app.server)
      .patch(`/v1/internal/documents/${doc.id}/ocr-result`)
      .set('x-internal-secret', 'dev-internal-secret')
      .send({
        ocrStatus: 'completed',
        extractedFields: {
          plateNumber: { value: 'CAB-1234', confidence: 0.97 },
          expiresAt:   { value: '2025-09-30', confidence: 0.92 },
          issueDate:   { value: '2024-10-01', confidence: 0.91 },
          licenseNumber: { value: 'RL-001234', confidence: 0.88 },
        },
      })

    expect(res.status).toBe(200)

    const { revenueLicenses } = await import('@/db/schema/index.js')
    const rl = await app.db.query.revenueLicenses.findFirst({
      where: eq(revenueLicenses.vehicleId, vehicle.id),
    })
    expect(rl).toBeTruthy()
    expect(rl?.expiryDate).toBe('2025-09-30')
  })

  it('returns 404 for unknown document id', async () => {
    const res = await supertest(app.server)
      .patch('/v1/internal/documents/00000000-0000-0000-0000-000000000000/ocr-result')
      .set('x-internal-secret', 'dev-internal-secret')
      .send({ ocrStatus: 'processing' })

    expect(res.status).toBe(404)
  })
})

// ─── Confirm OCR fields ───────────────────────────────────────────────────────

describe('PATCH /v1/vehicles/:id/documents/:docId/confirm-ocr', () => {
  it('marks document as verified', async () => {
    const user = await createTestUser(app)
    const vehicle = await createTestVehicle(app, user.accessToken)

    // Upload a document first
    const uploadRes = await supertest(app.server)
      .post(`/v1/vehicles/${vehicle.id}/documents`)
      .set(getAuthHeader(user.accessToken))
      .query({ documentType: 'revenue_license', title: 'My RL' })
      .attach('file', Buffer.from('fake'), { filename: 'rl.pdf', contentType: 'application/pdf' })

    const docId = uploadRes.body.id

    const res = await supertest(app.server)
      .patch(`/v1/vehicles/${vehicle.id}/documents/${docId}/confirm-ocr`)
      .set(getAuthHeader(user.accessToken))

    expect(res.status).toBe(200)
    expect(res.body.isVerified).toBe(true)
  })
})
