import { pgTable, uuid, text, date, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'
import { vehicles } from './vehicles'

export const ownershipTransferTypeEnum = pgEnum('ownership_transfer_type', [
  'purchase', 'gift', 'inheritance', 'repossession', 'other',
])

export const ownershipHistory = pgTable('ownership_history', {
  id:           uuid('id').primaryKey().defaultRandom(),
  vehicleId:    uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  ownerId:      uuid('owner_id').notNull().references(() => users.id),
  transferType: ownershipTransferTypeEnum('transfer_type').notNull().default('purchase'),
  startDate:    date('start_date').notNull(),
  endDate:      date('end_date'),
  notes:        text('notes'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type OwnershipHistory = typeof ownershipHistory.$inferSelect
export type NewOwnershipHistory = typeof ownershipHistory.$inferInsert
