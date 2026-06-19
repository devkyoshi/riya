import type { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './transfers.service.js'

export async function initiateTransfer(
  req: FastifyRequest<{ Params: { id: string }; Body: { toEmail: string; transferType?: string; notes?: string; expiresInDays?: number } }>,
  reply: FastifyReply,
) {
  const transfer = await service.initiateTransfer(req.server.db, req.params.id, req.user.sub, req.body)
  return reply.code(201).send(transfer)
}

export async function claimTransfer(
  req: FastifyRequest<{ Params: { claimToken: string } }>,
  reply: FastifyReply,
) {
  const result = await service.claimTransfer(req.server.db, req.params.claimToken, req.user.sub)
  return reply.send(result)
}

export async function cancelTransfer(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await service.cancelTransfer(req.server.db, req.params.id, req.user.sub)
  return reply.code(204).send()
}

export async function getPendingTransfer(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const transfer = await service.getPendingTransfer(req.server.db, req.params.id, req.user.sub)
  return reply.send(transfer ?? null)
}
