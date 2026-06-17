import { sql } from 'drizzle-orm'
import type { Db } from '@/db/index.js'

// Use DELETE in dependency order to avoid CASCADE wiping seed tables
// (TRUNCATE CASCADE would wipe roles/features which we need between tests)
const DELETE_ORDER = [
  'timeline_posts',
  'emission_tests',
  'revenue_licenses',
  'insurance_policies',
  'service_records',
  'documents',
  'ownership_history',
  'vehicles',
  'refresh_tokens',
  'user_roles',
  'users',
]

export async function truncateAllTables(db: Db) {
  for (const table of DELETE_ORDER) {
    await db.execute(sql.raw(`DELETE FROM "${table}"`))
  }
}
