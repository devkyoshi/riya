import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateVehicleBody, UpdateVehicleBody } from './vehicles.schemas.js'
import * as service from './vehicles.service.js'
import { LocalStorageAdapter } from '@/shared/storage.js'
import { config } from '@/config.js'
import { generateQrPng, generateQrSvg } from '@/shared/qr.js'

function getStorage() {
  return new LocalStorageAdapter(config.STORAGE_LOCAL_PATH, `http://localhost:${config.PORT}`)
}

export async function createVehicle(req: FastifyRequest<{ Body: CreateVehicleBody }>, reply: FastifyReply) {
  const vehicle = await service.createVehicle(req.server.db, req.user.sub, req.body)
  return reply.code(201).send(vehicle)
}

export async function listVehicles(req: FastifyRequest, reply: FastifyReply) {
  const list = await service.listVehicles(req.server.db, req.user.sub)
  return reply.send(list)
}

export async function getVehicle(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const vehicle = await service.getVehicle(req.server.db, req.params.id, req.user.sub)
  return reply.send(vehicle)
}

export async function updateVehicle(
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateVehicleBody }>,
  reply: FastifyReply,
) {
  const vehicle = await service.updateVehicle(req.server.db, req.params.id, req.user.sub, req.body)
  return reply.send(vehicle)
}

export async function deleteVehicle(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  await service.deleteVehicle(req.server.db, req.params.id, req.user.sub)
  return reply.code(204).send()
}

export async function uploadCoverPhoto(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const file = await req.file()
  if (!file) return reply.code(400).send({ error: 'NoFile', message: 'No file uploaded' })

  const storage = getStorage()
  const { url } = await storage.upload(file, `vehicles/${req.params.id}/cover`)
  const vehicle = await service.updateCoverPhoto(req.server.db, req.params.id, req.user.sub, url)
  return reply.send(vehicle)
}

export async function getQrCode(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { format?: string } }>,
  reply: FastifyReply,
) {
  await service.getVehicle(req.server.db, req.params.id, req.user.sub)
  const vehicleUrl = `${config.FRONTEND_URL}/vehicles/${req.params.id}`

  if (req.query.format === 'svg') {
    const svg = await generateQrSvg(vehicleUrl)
    return reply.header('Content-Type', 'image/svg+xml').send(svg)
  }

  const png = await generateQrPng(vehicleUrl)
  return reply.header('Content-Type', 'image/png').send(png)
}
