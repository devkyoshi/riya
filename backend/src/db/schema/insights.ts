import { pgTable, uuid, varchar, integer, text, boolean, timestamp, date, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'
import { vehicles } from './vehicles'

export const mileageLog = pgTable('mileage_log', {
  id:          uuid('id').primaryKey().defaultRandom(),
  vehicleId:   uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  addedBy:     uuid('added_by').notNull().references(() => users.id),
  mileageKm:   integer('mileage_km').notNull(),
  recordedAt:  date('recorded_at').notNull(),
  source:      varchar('source', { length: 50 }).notNull().default('manual'),
  notes:       text('notes'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const healthScores = pgTable('health_scores', {
  id:            uuid('id').primaryKey().defaultRandom(),
  vehicleId:     uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }).unique(),
  score:         integer('score').notNull(),
  grade:         varchar('grade', { length: 2 }).notNull(),
  factors:       jsonb('factors').notNull().default({}),
  calculatedAt:  timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const valuationPredictions = pgTable('valuation_predictions', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  vehicleId:          uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }).unique(),
  estimatedValueLkr:  integer('estimated_value_lkr').notNull(),
  minValueLkr:        integer('min_value_lkr').notNull(),
  maxValueLkr:        integer('max_value_lkr').notNull(),
  factors:            jsonb('factors').notNull().default({}),
  calculatedAt:       timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const fraudFlags = pgTable('fraud_flags', {
  id:          uuid('id').primaryKey().defaultRandom(),
  vehicleId:   uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  type:        varchar('type', { length: 100 }).notNull(),
  severity:    varchar('severity', { length: 20 }).notNull().default('medium'),
  details:     jsonb('details').notNull().default({}),
  isResolved:  boolean('is_resolved').notNull().default(false),
  resolvedAt:  timestamp('resolved_at', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type MileageLog = typeof mileageLog.$inferSelect
export type NewMileageLog = typeof mileageLog.$inferInsert
export type HealthScore = typeof healthScores.$inferSelect
export type NewHealthScore = typeof healthScores.$inferInsert
export type ValuationPrediction = typeof valuationPredictions.$inferSelect
export type NewValuationPrediction = typeof valuationPredictions.$inferInsert
export type FraudFlag = typeof fraudFlags.$inferSelect
export type NewFraudFlag = typeof fraudFlags.$inferInsert
