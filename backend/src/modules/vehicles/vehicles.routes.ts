import type { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import { CreateVehicleSchema, UpdateVehicleSchema } from './vehicles.schemas.js'
import * as handlers from './vehicles.handlers.js'

const vehiclesRoutes: FastifyPluginAsync = async (fastify) => {
  const auth = [fastify.requireAuth()]
  const authVault = [fastify.requireAuth(), fastify.requireFeature('document_vault')]
  const authQr = [fastify.requireAuth(), fastify.requireFeature('qr_sharing')]

  fastify.post('/', {
    schema: { tags: ['Vehicles'], summary: 'Create a new vehicle', body: CreateVehicleSchema },
    preHandler: auth,
    handler: handlers.createVehicle,
  })

  fastify.get('/', {
    schema: { tags: ['Vehicles'], summary: "List current user's vehicles" },
    preHandler: auth,
    handler: handlers.listVehicles,
  })

  fastify.get('/:id', {
    schema: { tags: ['Vehicles'], summary: 'Get vehicle profile', params: Type.Object({ id: Type.String() }) },
    preHandler: auth,
    handler: handlers.getVehicle,
  })

  fastify.patch('/:id', {
    schema: { tags: ['Vehicles'], summary: 'Update vehicle', params: Type.Object({ id: Type.String() }), body: UpdateVehicleSchema },
    preHandler: auth,
    handler: handlers.updateVehicle,
  })

  fastify.delete('/:id', {
    schema: { tags: ['Vehicles'], summary: 'Delete vehicle (soft)', params: Type.Object({ id: Type.String() }) },
    preHandler: auth,
    handler: handlers.deleteVehicle,
  })

  fastify.post('/:id/cover-photo', {
    schema: { tags: ['Vehicles'], summary: 'Upload cover photo', params: Type.Object({ id: Type.String() }),
      consumes: ['multipart/form-data'] },
    preHandler: authVault,
    handler: handlers.uploadCoverPhoto,
  })

  fastify.get('/:id/qr', {
    schema: {
      tags: ['Vehicles'], summary: 'Generate QR code',
      params: Type.Object({ id: Type.String() }),
      querystring: Type.Object({ format: Type.Optional(Type.Union([Type.Literal('png'), Type.Literal('svg')])) }),
    },
    preHandler: authQr,
    handler: handlers.getQrCode,
  })
}

export default vehiclesRoutes
