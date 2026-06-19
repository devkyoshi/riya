import type { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './insights.service.js'

export async function addMileageEntry(
  req: FastifyRequest<{ Params: { id: string }; Body: { mileageKm: number; recordedAt: string; source?: string; notes?: string } }>,
  reply: FastifyReply,
) {
  const entry = await service.addMileageEntry(req.server.db, req.params.id, req.user.sub, req.body)
  return reply.code(201).send(entry)
}

export async function listMileageLog(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const log = await service.listMileageLog(req.server.db, req.params.id, req.user.sub)
  return reply.send(log)
}

export async function getHealthScore(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.computeHealthScore(req.server.db, req.params.id, req.user.sub)
  return reply.send(result)
}

export async function getValuation(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.computeValuation(req.server.db, req.params.id, req.user.sub)
  return reply.send(result)
}

export async function getMaintenanceSchedule(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.getMaintenanceSchedule(req.server.db, req.params.id, req.user.sub)
  return reply.send(result)
}

export async function runFraudCheck(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.runFraudCheck(req.server.db, req.params.id, req.user.sub)
  return reply.send(result)
}

export async function listFraudFlags(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const flags = await service.listFraudFlags(req.server.db, req.params.id, req.user.sub)
  return reply.send(flags)
}
