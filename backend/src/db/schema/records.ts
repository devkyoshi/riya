import { pgTable, uuid, varchar, text, integer, boolean, timestamp, date, numeric, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'
import { vehicles } from './vehicles'

export const serviceRecords = pgTable('service_records', {
  id:          uuid('id').primaryKey().defaultRandom(),
  vehicleId:   uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  addedBy:     uuid('added_by').notNull().references(() => users.id),
  garageId:    uuid('garage_id'),
  garageName:  varchar('garage_name', { length: 255 }),
  serviceDate: date('service_date').notNull(),
  mileageKm:   integer('mileage_km').notNull(),
  description: text('description').notNull(),
  parts:       jsonb('parts'),
  laborCost:   numeric('labor_cost', { precision: 10, scale: 2 }),
  totalCost:   numeric('total_cost', { precision: 10, scale: 2 }),
  currency:    varchar('currency', { length: 3 }).notNull().default('LKR'),
  isVerified:  boolean('is_verified').notNull().default(false),
  receiptUrl:  text('receipt_url'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const insurancePolicies = pgTable('insurance_policies', {
  id:           uuid('id').primaryKey().defaultRandom(),
  vehicleId:    uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  addedBy:      uuid('added_by').notNull().references(() => users.id),
  provider:     varchar('provider', { length: 255 }).notNull(),
  policyNumber: varchar('policy_number', { length: 100 }).notNull(),
  coverageType: varchar('coverage_type', { length: 100 }),
  startDate:    date('start_date').notNull(),
  endDate:      date('end_date').notNull(),
  premiumLkr:   numeric('premium_lkr', { precision: 12, scale: 2 }),
  documentUrl:  text('document_url'),
  claims:       jsonb('claims').notNull().default([]),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const revenueLicenses = pgTable('revenue_licenses', {
  id:             uuid('id').primaryKey().defaultRandom(),
  vehicleId:      uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  addedBy:        uuid('added_by').notNull().references(() => users.id),
  licenseNumber:  varchar('license_number', { length: 100 }),
  issueDate:      date('issue_date').notNull(),
  expiryDate:     date('expiry_date').notNull(),
  feeAmountLkr:   numeric('fee_amount_lkr', { precision: 10, scale: 2 }),
  certificateUrl: text('certificate_url'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const emissionTests = pgTable('emission_tests', {
  id:             uuid('id').primaryKey().defaultRandom(),
  vehicleId:      uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  addedBy:        uuid('added_by').notNull().references(() => users.id),
  testDate:       date('test_date').notNull(),
  expiryDate:     date('expiry_date').notNull(),
  testCenter:     varchar('test_center', { length: 255 }),
  result:         varchar('result', { length: 20 }).notNull().default('pass'),
  certificateUrl: text('certificate_url'),
  readings:       jsonb('readings'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type ServiceRecord = typeof serviceRecords.$inferSelect
export type NewServiceRecord = typeof serviceRecords.$inferInsert
export type InsurancePolicy = typeof insurancePolicies.$inferSelect
export type NewInsurancePolicy = typeof insurancePolicies.$inferInsert
export type RevenueLicense = typeof revenueLicenses.$inferSelect
export type NewRevenueLicense = typeof revenueLicenses.$inferInsert
export type EmissionTest = typeof emissionTests.$inferSelect
export type NewEmissionTest = typeof emissionTests.$inferInsert
