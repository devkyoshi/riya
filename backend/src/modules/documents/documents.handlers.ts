import type { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './documents.service.js'
import { LocalStorageAdapter } from '@/shared/storage.js'
import { config } from '@/config.js'

function getStorage() {
  return new LocalStorageAdapter(config.STORAGE_LOCAL_PATH, `http://localhost:${config.PORT}`)
}

export async function uploadDocument(
  req: FastifyRequest<{
    Params: { id: string }
    Querystring: { documentType: string; title: string; notes?: string; expiresAt?: string }
  }>,
  reply: FastifyReply,
) {
  const file = await req.file()
  if (!file) return reply.code(400).send({ error: 'NoFile', message: 'No file uploaded' })

  const { documentType, title, notes, expiresAt } = req.query
  if (!documentType || !title) {
    return reply.code(400).send({ error: 'MissingFields', message: 'documentType and title are required query params' })
  }

  const doc = await service.uploadDocument(
    req.server.db,
    getStorage(),
    req.params.id,
    req.user.sub,
    file,
    { documentType, title, notes, expiresAt },
  )
  return reply.code(201).send(doc)
}

export async function listDocuments(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { type?: string } }>,
  reply: FastifyReply,
) {
  const docs = await service.listDocuments(req.server.db, req.params.id, req.user.sub, req.query.type)
  return reply.send(docs)
}

export async function getDocument(
  req: FastifyRequest<{ Params: { id: string; docId: string } }>,
  reply: FastifyReply,
) {
  const doc = await service.getDocument(req.server.db, req.params.id, req.params.docId, req.user.sub)
  return reply.send(doc)
}

export async function deleteDocument(
  req: FastifyRequest<{ Params: { id: string; docId: string } }>,
  reply: FastifyReply,
) {
  await service.deleteDocument(req.server.db, getStorage(), req.params.id, req.params.docId, req.user.sub)
  return reply.code(204).send()
}

export async function confirmOcrFields(
  req: FastifyRequest<{ Params: { id: string; docId: string } }>,
  reply: FastifyReply,
) {
  const doc = await service.confirmOcrFields(req.server.db, req.params.id, req.params.docId, req.user.sub)
  return reply.send(doc)
}
