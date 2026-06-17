import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const fuelTypeEnum = pgEnum('fuel_type', ['petrol', 'diesel', 'electric', 'hybrid', 'lpg'])
export const transmissionEnum = pgEnum('transmission', ['manual', 'automatic', 'cvt'])
export const conditionEnum = pgEnum('condition', ['excellent', 'good', 'fair', 'poor'])

export const vehicles = pgTable('vehicles', {
  id:               uuid('id').primaryKey().defaultRandom(),
  ownerId:          uuid('owner_id').notNull().references(() => users.id),
  plateNumber:      varchar('plate_number', { length: 20 }).notNull().unique(),
  chassisNumber:    varchar('chassis_number', { length: 50 }),
  engineNumber:     varchar('engine_number', { length: 50 }),
  make:             varchar('make', { length: 100 }).notNull(),
  model:            varchar('model', { length: 100 }).notNull(),
  variant:          varchar('variant', { length: 100 }),
  year:             integer('year').notNull(),
  color:            varchar('color', { length: 50 }),
  fuelType:         fuelTypeEnum('fuel_type').notNull(),
  transmission:     transmissionEnum('transmission').notNull(),
  engineCapacityCC: integer('engine_capacity_cc'),
  currentMileageKm: integer('current_mileage_km').notNull().default(0),
  condition:        conditionEnum('condition').notNull().default('good'),
  coverPhotoUrl:    text('cover_photo_url'),
  bio:              text('bio'),
  isActive:         boolean('is_active').notNull().default(true),
  metadata:         jsonb('metadata'),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Vehicle = typeof vehicles.$inferSelect
export type NewVehicle = typeof vehicles.$inferInsert
