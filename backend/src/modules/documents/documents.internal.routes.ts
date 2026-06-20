import type { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import { eq, and } from 'drizzle-orm'
import { config } from '@/config.js'
import { documents, revenueLicenses, emissionTests, timelinePosts } from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'

const ExtractedFieldSchema = Type.Object({
  value: Type.Union([Type.String(), Type.Null()]),
  confidence: Type.Number(),
})

const OcrResultSchema = Type.Object({
  ocrStatus: Type.Union([
    Type.Literal('processing'),
    Type.Literal('completed'),
    Type.Literal('failed'),
  ]),
  extractedFields: Type.Optional(Type.Union([
    Type.Record(Type.String(), ExtractedFieldSchema),
    Type.Null(),
  ])),
})

const documentsInternalRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.patch('/internal/documents/:id/ocr-result', {
    schema: {
      tags: ['Internal'],
      summary: 'OCR service callback — update document extraction result',
      security: [],
      params: Type.Object({ id: Type.String() }),
      body: OcrResultSchema,
    },
    handler: async (request, reply) => {
      // Validate internal secret to prevent external callers
      const secret = request.headers['x-internal-secret']
      if (secret !== config.OCR_INTERNAL_SECRET) {
        throw new AppError(401, 'Unauthorized', 'Invalid internal secret')
      }

      const { id } = request.params as { id: string }
      const { ocrStatus, extractedFields } = request.body as any

      const db = fastify.db

      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, id),
      })
      if (!doc) throw new AppError(404, 'DocumentNotFound', 'Document not found')

      await db.update(documents)
        .set({
          ocrStatus,
          ...(extractedFields !== undefined ? { extractedFields } : {}),
        })
        .where(eq(documents.id, id))

      // Auto-propagate to entity tables on completion
      if (ocrStatus === 'completed' && extractedFields) {
        await _propagateFields(fastify.db, doc, extractedFields)
      }

      return reply.code(200).send({ ok: true })
    },
  })
}

async function _propagateFields(
  db: any,
  doc: any,
  fields: Record<string, { value: string | null; confidence: number }>,
) {
  const get = (key: string) => fields[key]?.value ?? null

  if (doc.documentType === 'revenue_license') {
    const expiresAt = get('expiresAt')
    const issueDate = get('issueDate')
    if (expiresAt && issueDate) {
      await db.insert(revenueLicenses).values({
        vehicleId: doc.vehicleId,
        addedBy: doc.uploadedBy,
        licenseNumber: get('licenseNumber'),
        issueDate,
        expiryDate: expiresAt,
        certificateUrl: doc.fileUrl,
      }).onConflictDoNothing()

      await db.insert(timelinePosts).values({
        vehicleId: doc.vehicleId,
        createdBy: doc.uploadedBy,
        postType: 'revenue_license',
        title: 'Revenue license auto-extracted from document',
        payload: { documentId: doc.id, extractedFields: fields },
        refId: doc.id,
        refTable: 'documents',
      })
    }
  }

  if (doc.documentType === 'emission_test') {
    const expiresAt = get('expiresAt')
    const testDate = get('testDate')
    if (expiresAt && testDate) {
      await db.insert(emissionTests).values({
        vehicleId: doc.vehicleId,
        addedBy: doc.uploadedBy,
        testDate,
        expiryDate: expiresAt,
        testCenter: get('testCenter'),
        result: get('result') ?? 'pass',
        certificateUrl: doc.fileUrl,
      }).onConflictDoNothing()

      await db.insert(timelinePosts).values({
        vehicleId: doc.vehicleId,
        createdBy: doc.uploadedBy,
        postType: 'emission_test',
        title: 'Emission test auto-extracted from document',
        payload: { documentId: doc.id, result: get('result') },
        refId: doc.id,
        refTable: 'documents',
      })
    }
  }
}

export default documentsInternalRoutes
