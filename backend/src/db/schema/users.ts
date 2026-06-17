import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:              uuid('id').primaryKey().defaultRandom(),
  email:           varchar('email', { length: 320 }).notNull().unique(),
  passwordHash:    text('password_hash'),
  fullName:        varchar('full_name', { length: 255 }).notNull(),
  avatarUrl:       text('avatar_url'),
  googleId:        varchar('google_id', { length: 255 }).unique(),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  isActive:        boolean('is_active').notNull().default(true),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
