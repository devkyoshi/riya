import type { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import * as handlers from './transfers.handlers.js'

const InitiateTransferBody = Type.Object({
  toEmail:       Type.String({ format: 'email' }),
  transferType:  Type.Optional(Type.Union([
    Type.Literal('purchase'), Type.Literal('gift'),
    Type.Literal('inheritance'), Type.Literal('repossession'), Type.Literal('other'),
  ])),
  notes:         Type.Optional(Type.String()),
  expiresInDays: Type.Optional(Type.Integer({ minimum: 1, maximum: 30 })),
})

const transfersRoutes: FastifyPluginAsync = async (fastify) => {
  const authTransfer = [fastify.requireAuth(), fastify.requireFeature('ownership_transfer')]

  fastify.post('/vehicles/:id/transfer', {
    schema: { tags: ['Transfers'], summary: 'Initiate an ownership transfer', params: Type.Object({ id: Type.String() }), body: InitiateTransferBody },
    preHandler: authTransfer,
    handler: handlers.initiateTransfer,
  })

  fastify.get('/vehicles/:id/transfer', {
    schema: { tags: ['Transfers'], summary: 'Get pending transfer for a vehicle', params: Type.Object({ id: Type.String() }) },
    preHandler: authTransfer,
    handler: handlers.getPendingTransfer,
  })

  fastify.delete('/vehicles/:id/transfer', {
    schema: { tags: ['Transfers'], summary: 'Cancel a pending transfer', params: Type.Object({ id: Type.String() }) },
    preHandler: authTransfer,
    handler: handlers.cancelTransfer,
  })

  fastify.post('/transfer/claim/:claimToken', {
    schema: {
      tags: ['Transfers'],
      summary: 'Claim a vehicle transfer (new owner)',
      params: Type.Object({ claimToken: Type.String() }),
    },
    preHandler: [fastify.requireAuth()],
    handler: handlers.claimTransfer,
  })
}

export default transfersRoutes
