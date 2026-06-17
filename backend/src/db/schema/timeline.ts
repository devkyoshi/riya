import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { vehicles } from './vehicles'
import { users } from './users'

export const timelinePostTypeEnum = pgEnum('timeline_post_type', [
  'service',
  'document_upload',
  'insurance_update',
  'revenue_license',
  'emission_test',
  'mileage_milestone',
  'ownership_transfer',
  'photo',
  'note',
])

export const visibilityEnum = pgEnum('visibility', ['private', 'shared', 'public'])

export const timelinePosts = pgTable('timeline_posts', {
  id:         uuid('id').primaryKey().defaultRandom(),
  vehicleId:  uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  createdBy:  uuid('created_by').notNull().references(() => users.id),
  postType:   timelinePostTypeEnum('post_type').notNull(),
  title:      varchar('title', { length: 255 }).notNull(),
  body:       text('body'),
  payload:    jsonb('payload').notNull().default({}),
  refId:      uuid('ref_id'),
  refTable:   varchar('ref_table', { length: 100 }),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type TimelinePost = typeof timelinePosts.$inferSelect
export type NewTimelinePost = typeof timelinePosts.$inferInsert
