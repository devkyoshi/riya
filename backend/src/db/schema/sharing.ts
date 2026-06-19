import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users'
import { vehicles } from './vehicles'

export const shareLinks = pgTable('share_links', {
  id:           uuid('id').primaryKey().defaultRandom(),
  vehicleId:    uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  issuedBy:     uuid('issued_by').notNull().references(() => users.id),
  token:        varchar('token', { length: 64 }).notNull().unique(),
  label:        varchar('label', { length: 100 }),
  scope:        jsonb('scope').notNull().default({
    serviceRecords: true,
    documents: true,
    insurancePolicies: true,
    revenueLicenses: true,
    emissionTests: true,
    mileageLog: true,
    timeline: true,
  }),
  isSingleUse:  boolean('is_single_use').notNull().default(false),
  isActive:     boolean('is_active').notNull().default(true),
  viewCount:    integer('view_count').notNull().default(0),
  expiresAt:    timestamp('expires_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vehicleCoOwners = pgTable('vehicle_co_owners', {
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  addedBy:   uuid('added_by').notNull().references(() => users.id),
  canEdit:   boolean('can_edit').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.vehicleId, t.userId] }),
}))

export type ShareLink = typeof shareLinks.$inferSelect
export type NewShareLink = typeof shareLinks.$inferInsert
export type VehicleCoOwner = typeof vehicleCoOwners.$inferSelect
export type NewVehicleCoOwner = typeof vehicleCoOwners.$inferInsert
