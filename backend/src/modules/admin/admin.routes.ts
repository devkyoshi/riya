import type { FastifyPluginAsync } from 'fastify'
import * as handlers from './admin.handlers.js'
import { Type } from '@sinclair/typebox'

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/features', {
    schema: {
      tags: ['Admin'],
      summary: 'List all feature flags',
    },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('admin_panel')],
    handler: handlers.listFeatures,
  })

  fastify.patch('/features/:key', {
    schema: {
      tags: ['Admin'],
      summary: 'Toggle a feature flag',
      params: Type.Object({ key: Type.String() }),
      body: Type.Object({ isEnabled: Type.Boolean() }),
    },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('admin_panel')],
    handler: handlers.toggleFeature,
  })
}

export default adminRoutes
