import { pgTable, uuid, varchar, text, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users'

export type RoleKey = 'owner' | 'co_owner' | 'buyer' | 'garage' | 'insurer' | 'admin'

export type FeatureKey =
  | 'document_vault'
  | 'service_records'
  | 'insurance_records'
  | 'revenue_licenses'
  | 'emission_tests'
  | 'timeline'
  | 'qr_sharing'
  | 'notifications'
  | 'admin_panel'
  | 'share_links'
  | 'co_owners'
  | 'ownership_transfer'
  | 'vehicle_insights'
  | 'partner_portal'

export const roles = pgTable('roles', {
  roleKey:     varchar('role_key', { length: 50 }).primaryKey(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
})

export const features = pgTable('features', {
  featureKey:  varchar('feature_key', { length: 100 }).primaryKey(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  isEnabled:   boolean('is_enabled').notNull().default(true),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy:   uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
})

export const roleFeaturePermissions = pgTable('role_feature_permissions', {
  roleKey:    varchar('role_key', { length: 50 }).notNull().references(() => roles.roleKey, { onDelete: 'cascade' }),
  featureKey: varchar('feature_key', { length: 100 }).notNull().references(() => features.featureKey, { onDelete: 'cascade' }),
  canAccess:  boolean('can_access').notNull().default(false),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleKey, t.featureKey] }),
}))

export const userRoles = pgTable('user_roles', {
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleKey:   varchar('role_key', { length: 50 }).notNull().references(() => roles.roleKey, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleKey] }),
}))

export type Role = typeof roles.$inferSelect
export type Feature = typeof features.$inferSelect
export type RoleFeaturePermission = typeof roleFeaturePermissions.$inferSelect
export type UserRole = typeof userRoles.$inferSelect
