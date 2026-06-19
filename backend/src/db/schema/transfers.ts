import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'
import { vehicles } from './vehicles'

export const transferStatusEnum = pgEnum('transfer_status', ['pending', 'completed', 'cancelled', 'expired'])

export const ownershipTransfers = pgTable('ownership_transfers', {
  id:              uuid('id').primaryKey().defaultRandom(),
  vehicleId:       uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  fromOwnerId:     uuid('from_owner_id').notNull().references(() => users.id),
  toUserId:        uuid('to_user_id').references(() => users.id),
  toEmail:         varchar('to_email', { length: 320 }).notNull(),
  transferType:    varchar('transfer_type', { length: 50 }).notNull().default('purchase'),
  notes:           text('notes'),
  status:          transferStatusEnum('status').notNull().default('pending'),
  claimToken:      varchar('claim_token', { length: 64 }).notNull().unique(),
  claimExpiresAt:  timestamp('claim_expires_at', { withTimezone: true }).notNull(),
  completedAt:     timestamp('completed_at', { withTimezone: true }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type OwnershipTransfer = typeof ownershipTransfers.$inferSelect
export type NewOwnershipTransfer = typeof ownershipTransfers.$inferInsert
