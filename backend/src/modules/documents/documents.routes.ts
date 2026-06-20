import type { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import * as handlers from './documents.handlers.js'

const documentsRoutes: FastifyPluginAsync = async (fastify) => {
  const preHandler = [fastify.requireAuth(), fastify.requireFeature('document_vault')]

  fastify.post('/vehicles/:id/documents', {
    schema: {
      tags: ['Documents'],
      summary: 'Upload a document',
      consumes: ['multipart/form-data'],
      params: Type.Object({ id: Type.String() }),
      querystring: Type.Object({
        documentType: Type.String(),
        title: Type.String(),
        notes: Type.Optional(Type.String()),
        expiresAt: Type.Optional(Type.String()),
      }),
    },
    preHandler,
    handler: handlers.uploadDocument,
  })

  fastify.get('/vehicles/:id/documents', {
    schema: {
      tags: ['Documents'],
      summary: 'List vehicle documents',
      params: Type.Object({ id: Type.String() }),
      querystring: Type.Object({ type: Type.Optional(Type.String()) }),
    },
    preHandler,
    handler: handlers.listDocuments,
  })

  fastify.get('/vehicles/:id/documents/:docId', {
    schema: {
      tags: ['Documents'],
      summary: 'Get a document',
      params: Type.Object({ id: Type.String(), docId: Type.String() }),
    },
    preHandler,
    handler: handlers.getDocument,
  })

  fastify.delete('/vehicles/:id/documents/:docId', {
    schema: {
      tags: ['Documents'],
      summary: 'Delete a document',
      params: Type.Object({ id: Type.String(), docId: Type.String() }),
    },
    preHandler,
    handler: handlers.deleteDocument,
  })

  fastify.patch('/vehicles/:id/documents/:docId/confirm-ocr', {
    schema: {
      tags: ['Documents'],
      summary: 'Confirm auto-extracted OCR fields (marks document as verified)',
      params: Type.Object({ id: Type.String(), docId: Type.String() }),
    },
    preHandler,
    handler: handlers.confirmOcrFields,
  })
}

export default documentsRoutes
