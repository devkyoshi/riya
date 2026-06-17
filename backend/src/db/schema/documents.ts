import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'
import { vehicles } from './vehicles'

export const documentTypeEnum = pgEnum('document_type', [
  'registration_certificate',
  'revenue_license',
  'emission_test',
  'insurance_policy',
  'service_receipt',
  'purchase_agreement',
  'other',
])

export const ocrStatusEnum = pgEnum('ocr_status', ['pending', 'processing', 'completed', 'failed', 'skipped'])

export const documents = pgTable('documents', {
  id:              uuid('id').primaryKey().defaultRandom(),
  vehicleId:       uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  uploadedBy:      uuid('uploaded_by').notNull().references(() => users.id),
  documentType:    documentTypeEnum('document_type').notNull(),
  title:           varchar('title', { length: 255 }).notNull(),
  fileUrl:         text('file_url').notNull(),
  fileKey:         text('file_key').notNull(),
  fileSizeBytes:   integer('file_size_bytes'),
  mimeType:        varchar('mime_type', { length: 100 }),
  ocrStatus:       ocrStatusEnum('ocr_status').notNull().default('skipped'),
  extractedFields: jsonb('extracted_fields'),
  isVerified:      boolean('is_verified').notNull().default(false),
  verifiedBy:      uuid('verified_by').references(() => users.id),
  expiresAt:       timestamp('expires_at', { withTimezone: true }),
  notes:           text('notes'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
