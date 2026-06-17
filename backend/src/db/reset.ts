import postgres from 'postgres'
import { config } from 'dotenv'
import { execSync } from 'child_process'

config()

const url = process.env.DATABASE_URL ?? ''
if (!url) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

// Parse DB name from connection string
const dbName = url.split('/').pop()?.split('?')[0] ?? 'riya_dev'

// Connect to postgres (default db) to drop/recreate
const adminUrl = url.replace(`/${dbName}`, '/postgres')
const client = postgres(adminUrl, { max: 1 })

console.log(`Dropping database: ${dbName}`)
await client.unsafe(`DROP DATABASE IF EXISTS "${dbName}"`)
console.log(`Creating database: ${dbName}`)
await client.unsafe(`CREATE DATABASE "${dbName}"`)
await client.end()

console.log('Running migrations...')
execSync('npm run db:migrate', { stdio: 'inherit' })

console.log('Running seeds...')
execSync('npm run db:seed', { stdio: 'inherit' })

console.log('Database reset complete.')
