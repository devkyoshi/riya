import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

config()

const __dirname = dirname(fileURLToPath(import.meta.url))

const connectionString =
  process.env.DATABASE_URL_TEST && process.env.DATABASE_URL === process.env.DATABASE_URL_TEST
    ? process.env.DATABASE_URL_TEST
    : (process.env.DATABASE_URL ?? '')

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

console.log(`Running migrations on: ${connectionString.replace(/:[^@]+@/, ':***@')}`)

await migrate(db, { migrationsFolder: resolve(__dirname, './migrations') })

console.log('Migrations complete.')
await client.end()
