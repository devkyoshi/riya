import type { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import { eq, and, desc } from 'drizzle-orm'
import { timelinePosts, vehicles } from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'

const timelineRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/vehicles/:id/timeline', {
    schema: {
      tags: ['Timeline'],
      summary: 'Get vehicle timeline feed',
      params: Type.Object({ id: Type.String() }),
      querystring: Type.Object({
        type:   Type.Optional(Type.String()),
        limit:  Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
        offset: Type.Optional(Type.Integer({ minimum: 0 })),
      }),
    },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('timeline')],
    async handler(req, reply) {
      const { id } = req.params as { id: string }
      const query = req.query as { type?: string; limit?: number; offset?: number }

      const vehicle = await fastify.db.query.vehicles.findFirst({
        where: and(eq(vehicles.id, id), eq(vehicles.isActive, true)),
      })
      if (!vehicle) throw new AppError(404, 'VehicleNotFound', 'Vehicle not found')
      if (vehicle.ownerId !== req.user.sub) throw new AppError(403, 'Forbidden', 'Access denied')

      const conditions = [eq(timelinePosts.vehicleId, id)]
      if (query.type) conditions.push(eq(timelinePosts.postType, query.type as any))

      const limit = Math.min(query.limit ?? 20, 100)
      const offset = query.offset ?? 0

      const posts = await fastify.db.query.timelinePosts.findMany({
        where: and(...conditions),
        orderBy: [desc(timelinePosts.createdAt)],
        limit,
        offset,
      })

      return reply.send({ data: posts, limit, offset, hasMore: posts.length === limit })
    },
  })
}

export default timelineRoutes
