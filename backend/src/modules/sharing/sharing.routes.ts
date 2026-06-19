import type { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import * as handlers from './sharing.handlers.js'

const ScopeSchema = Type.Optional(Type.Object({
  serviceRecords:    Type.Optional(Type.Boolean()),
  documents:         Type.Optional(Type.Boolean()),
  insurancePolicies: Type.Optional(Type.Boolean()),
  revenueLicenses:   Type.Optional(Type.Boolean()),
  emissionTests:     Type.Optional(Type.Boolean()),
  mileageLog:        Type.Optional(Type.Boolean()),
  timeline:          Type.Optional(Type.Boolean()),
}))

const CreateShareLinkBody = Type.Object({
  label:         Type.Optional(Type.String({ maxLength: 100 })),
  scope:         ScopeSchema,
  expiresInDays: Type.Optional(Type.Integer({ minimum: 1, maximum: 365 })),
  isSingleUse:   Type.Optional(Type.Boolean()),
})

const AddCoOwnerBody = Type.Object({
  email:   Type.String({ format: 'email' }),
  canEdit: Type.Optional(Type.Boolean()),
})

const sharingRoutes: FastifyPluginAsync = async (fastify) => {
  const authShare = [fastify.requireAuth(), fastify.requireFeature('share_links')]
  const authCoOwner = [fastify.requireAuth(), fastify.requireFeature('co_owners')]

  // ─── Share Links ────────────────────────────────────────────────────────────
  fastify.post('/vehicles/:id/share-links', {
    schema: { tags: ['Sharing'], summary: 'Create a scoped share link', params: Type.Object({ id: Type.String() }), body: CreateShareLinkBody },
    preHandler: authShare,
    handler: handlers.createShareLink,
  })

  fastify.get('/vehicles/:id/share-links', {
    schema: { tags: ['Sharing'], summary: 'List active share links for a vehicle', params: Type.Object({ id: Type.String() }) },
    preHandler: authShare,
    handler: handlers.listShareLinks,
  })

  fastify.delete('/vehicles/:id/share-links/:linkId', {
    schema: { tags: ['Sharing'], summary: 'Revoke a share link', params: Type.Object({ id: Type.String(), linkId: Type.String() }) },
    preHandler: authShare,
    handler: handlers.revokeShareLink,
  })

  // ─── Public Share Viewer (no auth) ─────────────────────────────────────────
  fastify.get('/share/:token', {
    schema: {
      tags: ['Sharing'],
      summary: 'Resolve a share link token — returns scoped vehicle data (no auth required)',
      security: [],
      params: Type.Object({ token: Type.String() }),
    },
    handler: handlers.getPublicShareView,
  })

  // ─── Co-Owners ──────────────────────────────────────────────────────────────
  fastify.post('/vehicles/:id/co-owners', {
    schema: { tags: ['Sharing'], summary: 'Add a co-owner by email', params: Type.Object({ id: Type.String() }), body: AddCoOwnerBody },
    preHandler: authCoOwner,
    handler: handlers.addCoOwner,
  })

  fastify.get('/vehicles/:id/co-owners', {
    schema: { tags: ['Sharing'], summary: 'List co-owners for a vehicle', params: Type.Object({ id: Type.String() }) },
    preHandler: authCoOwner,
    handler: handlers.listCoOwners,
  })

  fastify.delete('/vehicles/:id/co-owners/:userId', {
    schema: { tags: ['Sharing'], summary: 'Remove a co-owner', params: Type.Object({ id: Type.String(), userId: Type.String() }) },
    preHandler: authCoOwner,
    handler: handlers.removeCoOwner,
  })
}

export default sharingRoutes
