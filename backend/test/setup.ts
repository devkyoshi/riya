import { beforeAll, afterAll } from 'vitest'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

config()

const __dirname = dirname(fileURLToPath(import.meta.url))

// Use test database
process.env.NODE_ENV = 'test'

const testDbUrl = process.env.DATABASE_URL_TEST ?? 'postgresql://riya:riya_dev_password@localhost:5433/riya_test'
process.env.DATABASE_URL = testDbUrl

let client: ReturnType<typeof postgres>

beforeAll(async () => {
  client = postgres(testDbUrl, { max: 1 })
  const db = drizzle(client)

  await migrate(db, {
    migrationsFolder: resolve(__dirname, '../src/db/migrations'),
  })

  // Seed roles/features for tests
  const { seedRoles } = await import('../src/seeds/roles.seed.js')
  await seedRoles()
}, 60000)

afterAll(async () => {
  if (client) await client.end()
})
