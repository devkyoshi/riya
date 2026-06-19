import { sql } from 'drizzle-orm'
import type { Db } from '@/db/index.js'

// Use DELETE in dependency order to avoid CASCADE wiping seed tables
// (TRUNCATE CASCADE would wipe roles/features which we need between tests)
const DELETE_ORDER = [
  // Phase 3/4/5 tables
  'share_links',
  'vehicle_co_owners',
  'ownership_transfers',
  'fraud_flags',
  'health_scores',
  'valuation_predictions',
  'mileage_log',
  'business_accounts',
  // Phase 0/1 tables
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
