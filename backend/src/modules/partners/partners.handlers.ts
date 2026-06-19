import type { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './partners.service.js'

export async function registerBusiness(
  req: FastifyRequest<{ Body: { type: 'garage' | 'insurer' | 'dealer'; businessName: string; registrationNumber?: string; address?: string; contactPhone?: string; contactEmail?: string } }>,
  reply: FastifyReply,
) {
  const account = await service.registerBusiness(req.server.db, req.user.sub, req.body)
  return reply.code(201).send(account)
}

export async function getMyBusiness(req: FastifyRequest, reply: FastifyReply) {
  const account = await service.getMyBusiness(req.server.db, req.user.sub)
  return reply.send(account)
}

export async function updateBusiness(
  req: FastifyRequest<{ Body: Partial<{ businessName: string; registrationNumber: string; address: string; contactPhone: string; contactEmail: string }> }>,
  reply: FastifyReply,
) {
  const account = await service.updateBusiness(req.server.db, req.user.sub, req.body)
  return reply.send(account)
}

export async function submitServiceRecord(
  req: FastifyRequest<{ Body: { vehiclePlate: string; serviceDate: string; mileageKm: number; description: string; parts?: any; laborCost?: string; totalCost?: string } }>,
  reply: FastifyReply,
) {
  const record = await service.submitServiceRecord(req.server.db, req.user.sub, req.body)
  return reply.code(201).send(record)
}

export async function submitInsurancePolicy(
  req: FastifyRequest<{ Body: { vehiclePlate: string; policyNumber: string; coverageType?: string; startDate: string; endDate: string; premiumLkr?: string } }>,
  reply: FastifyReply,
) {
  const policy = await service.submitInsurancePolicy(req.server.db, req.user.sub, req.body)
  return reply.code(201).send(policy)
}

export async function listMySubmissions(req: FastifyRequest, reply: FastifyReply) {
  const submissions = await service.listMySubmissions(req.server.db, req.user.sub)
  return reply.send(submissions)
}
