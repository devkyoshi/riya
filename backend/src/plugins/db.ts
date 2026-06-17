import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema/index.js'
import { config } from '@/config.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const connectionString =
    config.NODE_ENV === 'test' && config.DATABASE_URL_TEST
      ? config.DATABASE_URL_TEST
      : config.DATABASE_URL

  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  fastify.decorate('db', db)

  fastify.addHook('onClose', async () => {
    await client.end()
  })
}

export default fp(dbPlugin, { name: 'db' })
