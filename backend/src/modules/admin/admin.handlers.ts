import type { FastifyRequest, FastifyReply } from 'fastify'
import { eq } from 'drizzle-orm'
import { features } from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'

export async function listFeatures(req: FastifyRequest, reply: FastifyReply) {
  const all = await req.server.db.query.features.findMany({
    orderBy: (f, { asc }) => [asc(f.featureKey)],
  })
  return reply.send(all)
}

export async function toggleFeature(
  req: FastifyRequest<{ Params: { key: string }; Body: { isEnabled: boolean } }>,
  reply: FastifyReply,
) {
  const { key } = req.params
  const { isEnabled } = req.body

  const existing = await req.server.db.query.features.findFirst({
    where: eq(features.featureKey, key),
  })

  if (!existing) {
    throw new AppError(404, 'FeatureNotFound', `Feature '${key}' not found`)
  }

  const [updated] = await req.server.db
    .update(features)
    .set({ isEnabled, updatedAt: new Date(), updatedBy: req.user.sub })
    .where(eq(features.featureKey, key))
    .returning()

  // Invalidate Redis cache for this feature
  await req.server.redis.del(`feature:${key}:enabled`)

  return reply.send(updated)
}
