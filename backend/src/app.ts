import Fastify, { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { config } from '@/config.js'
import { errorHandler } from '@/shared/errors.js'

// Plugins
import sensiblePlugin from '@/plugins/sensible.js'
import corsPlugin from '@/plugins/cors.js'
import dbPlugin from '@/plugins/db.js'
import redisPlugin from '@/plugins/redis.js'
import jwtPlugin from '@/plugins/jwt.js'
import swaggerPlugin from '@/plugins/swagger.js'
import rbacPlugin from '@/plugins/rbac.js'
import multipartPlugin from '@/plugins/multipart.js'

// Routes
import authRoutes from '@/modules/auth/auth.routes.js'
import vehiclesRoutes from '@/modules/vehicles/vehicles.routes.js'
import documentsRoutes from '@/modules/documents/documents.routes.js'
import recordsRoutes from '@/modules/records/records.routes.js'
import timelineRoutes from '@/modules/timeline/timeline.routes.js'
import adminRoutes from '@/modules/admin/admin.routes.js'
import sharingRoutes from '@/modules/sharing/sharing.routes.js'
import transfersRoutes from '@/modules/transfers/transfers.routes.js'
import insightsRoutes from '@/modules/insights/insights.routes.js'
import partnersRoutes from '@/modules/partners/partners.routes.js'

export interface BuildAppOptions {
  testing?: boolean
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.testing
      ? false
      : { level: config.LOG_LEVEL, transport: { target: 'pino-pretty', options: { colorize: true } } },
    ajv: {
      customOptions: { strict: 'log', keywords: ['kind', 'modifier'] },
    },
  })

  app.setErrorHandler(errorHandler)

  // Plugins (order matters — dependencies first)
  await app.register(sensiblePlugin)
  await app.register(corsPlugin)
  await app.register(dbPlugin)
  await app.register(redisPlugin)
  await app.register(jwtPlugin)

  if (!opts.testing) {
    await app.register(swaggerPlugin)
  }

  await app.register(rbacPlugin)
  await app.register(multipartPlugin)

  // Static file serving for local uploads
  const { default: staticPlugin } = await import('@fastify/static')
  const { resolve } = await import('path')
  app.register(staticPlugin, {
    root: resolve(config.STORAGE_LOCAL_PATH),
    prefix: '/uploads/',
    decorateReply: false,
  })

  // Health check (no auth)
  app.get('/v1/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      security: [],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    handler: async () => ({ status: 'ok', timestamp: new Date().toISOString() }),
  })

  // Routes
  await app.register(authRoutes,      { prefix: '/v1/auth' })
  await app.register(vehiclesRoutes,  { prefix: '/v1/vehicles' })
  await app.register(documentsRoutes, { prefix: '/v1' })
  await app.register(recordsRoutes,   { prefix: '/v1' })
  await app.register(timelineRoutes,  { prefix: '/v1' })
  await app.register(adminRoutes,     { prefix: '/v1/admin' })
  await app.register(sharingRoutes,   { prefix: '/v1' })
  await app.register(transfersRoutes, { prefix: '/v1' })
  await app.register(insightsRoutes,  { prefix: '/v1' })
  await app.register(partnersRoutes,  { prefix: '/v1' })

  return app
}
