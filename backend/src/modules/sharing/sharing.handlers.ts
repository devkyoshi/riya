import type { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './sharing.service.js'
import * as publicService from './sharing.public.service.js'

// ─── Share Links ──────────────────────────────────────────────────────────────

export async function createShareLink(
  req: FastifyRequest<{ Params: { id: string }; Body: { label?: string; scope?: Record<string, boolean>; expiresInDays?: number; isSingleUse?: boolean } }>,
  reply: FastifyReply,
) {
  const link = await service.createShareLink(req.server.db, req.params.id, req.user.sub, req.body)
  return reply.code(201).send(link)
}

export async function listShareLinks(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const links = await service.listShareLinks(req.server.db, req.params.id, req.user.sub)
  return reply.send(links)
}

export async function revokeShareLink(
  req: FastifyRequest<{ Params: { id: string; linkId: string } }>,
  reply: FastifyReply,
) {
  await service.revokeShareLink(req.server.db, req.params.id, req.params.linkId, req.user.sub)
  return reply.code(204).send()
}

export async function getPublicShareView(
  req: FastifyRequest<{ Params: { token: string } }>,
  reply: FastifyReply,
) {
  const data = await publicService.getShareView(req.server.db, req.params.token)
  return reply.send(data)
}

// ─── Co-Owners ────────────────────────────────────────────────────────────────

export async function addCoOwner(
  req: FastifyRequest<{ Params: { id: string }; Body: { email: string; canEdit?: boolean } }>,
  reply: FastifyReply,
) {
  const coOwner = await service.addCoOwner(req.server.db, req.params.id, req.user.sub, req.body)
  return reply.code(201).send(coOwner)
}

export async function listCoOwners(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const list = await service.listCoOwners(req.server.db, req.params.id, req.user.sub)
  return reply.send(list)
}

export async function removeCoOwner(
  req: FastifyRequest<{ Params: { id: string; userId: string } }>,
  reply: FastifyReply,
) {
  await service.removeCoOwner(req.server.db, req.params.id, req.params.userId, req.user.sub)
  return reply.code(204).send()
}
