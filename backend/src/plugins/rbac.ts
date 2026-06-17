import fp from 'fastify-plugin'
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { eq, and, inArray } from 'drizzle-orm'
import { userRoles, roleFeaturePermissions, features } from '@/db/schema/index.js'
import type { FeatureKey } from '@/db/schema/rbac.js'
import type { JwtPayload } from './jwt.js'

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: () => (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireFeature: (key: FeatureKey) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const rbacPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('requireAuth', () => async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing token' })
    }
  })

  fastify.decorate('requireFeature', (featureKey: FeatureKey) => {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      const user = req.user as JwtPayload

      // Check feature enabled (Redis-cached, 60s TTL)
      const featureCacheKey = `feature:${featureKey}:enabled`
      let isEnabledStr = await fastify.redis.get(featureCacheKey)

      if (isEnabledStr === null) {
        const feature = await fastify.db.query.features.findFirst({
          where: eq(features.featureKey, featureKey),
        })
        isEnabledStr = feature?.isEnabled ? '1' : '0'
        await fastify.redis.setex(featureCacheKey, 60, isEnabledStr)
      }

      if (isEnabledStr === '0') {
        return reply.code(403).send({ error: 'Forbidden', message: 'This feature is currently disabled' })
      }

      // Admin bypasses role permission check
      if (user.roles.includes('admin')) return

      // Check user's role permissions (Redis-cached, 120s TTL)
      const permCacheKey = `rbac:${user.sub}:${featureKey}`
      let canAccessStr = await fastify.redis.get(permCacheKey)

      if (canAccessStr === null) {
        const userRolesList = await fastify.db.query.userRoles.findMany({
          where: eq(userRoles.userId, user.sub),
        })
        const roleKeys = userRolesList.map((r) => r.roleKey)

        if (roleKeys.length === 0) {
          canAccessStr = '0'
        } else {
          const perms = await fastify.db.query.roleFeaturePermissions.findMany({
            where: and(
              inArray(roleFeaturePermissions.roleKey, roleKeys),
              eq(roleFeaturePermissions.featureKey, featureKey),
              eq(roleFeaturePermissions.canAccess, true),
            ),
          })
          canAccessStr = perms.length > 0 ? '1' : '0'
        }

        await fastify.redis.setex(permCacheKey, 120, canAccessStr)
      }

      if (canAccessStr === '0') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Insufficient permissions for this feature' })
      }
    }
  })
}

export default fp(rbacPlugin, { name: 'rbac', dependencies: ['jwt', 'redis', 'db'] })
