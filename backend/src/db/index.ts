import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '@/config.js'
import * as schema from './schema/index.js'

const connectionString =
  config.NODE_ENV === 'test' && config.DATABASE_URL_TEST
    ? config.DATABASE_URL_TEST
    : config.DATABASE_URL

const client = postgres(connectionString)

export const db = drizzle(client, { schema })
export type Db = typeof db
