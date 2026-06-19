import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const businessTypeEnum = pgEnum('business_type', ['garage', 'insurer', 'dealer'])

export const businessAccounts = pgTable('business_accounts', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  ownerId:            uuid('owner_id').notNull().references(() => users.id).unique(),
  type:               businessTypeEnum('type').notNull(),
  businessName:       varchar('business_name', { length: 255 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 100 }),
  address:            text('address'),
  contactPhone:       varchar('contact_phone', { length: 50 }),
  contactEmail:       varchar('contact_email', { length: 320 }),
  isVerified:         boolean('is_verified').notNull().default(false),
  verificationNote:   text('verification_note'),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type BusinessAccount = typeof businessAccounts.$inferSelect
export type NewBusinessAccount = typeof businessAccounts.$inferInsert
