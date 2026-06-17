import type { FastifyRequest, FastifyReply } from 'fastify'
import * as service from './records.service.js'

type VehicleParams = { id: string }

export async function addServiceRecord(req: FastifyRequest<{ Params: VehicleParams; Body: any }>, reply: FastifyReply) {
  const record = await service.addServiceRecord(req.server.db, req.params.id, req.user.sub, req.body)
  return reply.code(201).send(record)
}

export async function listServiceRecords(req: FastifyRequest<{ Params: VehicleParams }>, reply: FastifyReply) {
  return reply.send(await service.listServiceRecords(req.server.db, req.params.id, req.user.sub))
}

export async function addInsurancePolicy(req: FastifyRequest<{ Params: VehicleParams; Body: any }>, reply: FastifyReply) {
  const policy = await service.addInsurancePolicy(req.server.db, req.params.id, req.user.sub, req.body)
  return reply.code(201).send(policy)
}

export async function listInsurancePolicies(req: FastifyRequest<{ Params: VehicleParams }>, reply: FastifyReply) {
  return reply.send(await service.listInsurancePolicies(req.server.db, req.params.id, req.user.sub))
}

export async function addRevenueLicense(req: FastifyRequest<{ Params: VehicleParams; Body: any }>, reply: FastifyReply) {
  const license = await service.addRevenueLicense(req.server.db, req.params.id, req.user.sub, req.body)
  return reply.code(201).send(license)
}

export async function listRevenueLicenses(req: FastifyRequest<{ Params: VehicleParams }>, reply: FastifyReply) {
  return reply.send(await service.listRevenueLicenses(req.server.db, req.params.id, req.user.sub))
}

export async function addEmissionTest(req: FastifyRequest<{ Params: VehicleParams; Body: any }>, reply: FastifyReply) {
  const test = await service.addEmissionTest(req.server.db, req.params.id, req.user.sub, req.body)
  return reply.code(201).send(test)
}

export async function listEmissionTests(req: FastifyRequest<{ Params: VehicleParams }>, reply: FastifyReply) {
  return reply.send(await service.listEmissionTests(req.server.db, req.params.id, req.user.sub))
}
