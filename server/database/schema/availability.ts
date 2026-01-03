import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

import { calendarDateField, creationAndUpdateTimestamps } from './columns.helpers'
import { organizations } from './organization'
import { users as authUsers } from './auth'
import { VALID_SCHEDULE_DAYS, VALID_SCHEDULE_EXCEPTION_TYPES } from '../../../shared/utils/constants.availability'
import { VALID_CONSULTATION_LOCATIONS } from '../../../shared/utils/constants.location'

/**
 * ================================================================
 * WEEKLY AVAILABILITY TEMPLATES TABLE
 * ================================================================
 * Stores recurring weekly availability patterns for users.
 * Each template belongs to both an organization and a user.
 * Templates define standard weekly schedule that gets repeated.
 */
export const weeklyAvailabilityTemplates = sqliteTable(
  'weekly_availability_templates',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }), // Owning organization
    userId: text()
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }), // related therapist user

    // ---- Weekly schedule fields ----
    dayOfWeek: text({ enum: VALID_SCHEDULE_DAYS }).notNull(), // Day of week — e.g., 'Mon'
    startTime: text().notNull(), // HH:MM:SS format — e.g., '09:00:00'
    endTime: text().notNull(), // HH:MM:SS format — e.g., '12:00:00'
    location: text({ enum: VALID_CONSULTATION_LOCATIONS }).notNull(), // Consultation location — e.g., 'clinic'

    // Created and Updated timestamp
    ...creationAndUpdateTimestamps
  },
  (table) => [
    // ---- Unique constraints ----
    // Prevent duplicate templates for same user+org+day+time combination
    index('idx_weekly_templates_unique').on(
      table.organizationId,
      table.userId,
      table.dayOfWeek,
      table.startTime,
      table.endTime
    ),

    // ---- Common query patterns (with deletedAt for active templates) ----
    // Get all active templates for a user in an organization: WHERE organizationId = ? AND userId = ?
    index('idx_weekly_templates_org_user').on(table.organizationId, table.userId),

    // Get templates by day of week: WHERE organizationId = ? AND userId = ? AND deletedAt IS NULL AND dayOfWeek = ?
    index('idx_weekly_templates_org_user_day').on(table.organizationId, table.userId, table.dayOfWeek),

    // Get templates by location: WHERE organizationId = ? AND location = ?
    index('idx_weekly_templates_org_location').on(table.organizationId, table.location)
  ]
)

/**
 * ================================================================
 * AVAILABILITY EXCEPTIONS TABLE
 * ================================================================
 * Stores specific date exceptions that override weekly templates.
 * Each exception belongs to both an organization and a user.
 * Exceptions override templates for specific dates.
 */
export const availabilityExceptions = sqliteTable(
  'availability_exceptions',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }), // Owning organization
    userId: text()
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }), // related therapist user

    // ---- Exception fields ----
    date: calendarDateField().notNull(), // YYYY-MM-DD (date-only)
    startTime: text(), // Optional start time for partial day exceptions — e.g., '09:00:00'
    endTime: text(), // Optional end time for partial day exceptions — e.g., '12:00:00'
    isAvailable: integer({ mode: 'boolean' }).notNull(), // Whether available during this exception — e.g., false for vacation
    reason: text({ enum: VALID_SCHEDULE_EXCEPTION_TYPES }), // Reason for exception — e.g., 'vacation'
    notes: text(), // Optional notes about the exception if other reason is selected

    // Created and Updated timestamp
    ...creationAndUpdateTimestamps
  },
  (table) => [
    // ---- Unique constraints ----
    // Prevent duplicate exceptions for the same user+org+date+time combination
    index('idx_exceptions_unique').on(table.organizationId, table.userId, table.date, table.startTime),

    // ---- Common query patterns (with deletedAt for active exceptions) ----
    // Get all active exceptions for a user in an organization: WHERE organizationId = ? AND userId = ?
    index('idx_exceptions_org_user').on(table.organizationId, table.userId),

    // Get exceptions for a specific date range: WHERE organizationId = ? AND userId = ? AND date >= ? AND date <= ?
    index('idx_exceptions_org_user_date').on(table.organizationId, table.userId, table.date),

    // Get available/unavailable exceptions: WHERE organizationId = ? AND userId = ? AND date >= ? AND isAvailable = ?
    index('idx_exceptions_org_user_date_range').on(table.organizationId, table.userId, table.date, table.isAvailable),

    // Get all exceptions by date across users: WHERE organizationId = ? AND date = ?
    index('idx_exceptions_org_date').on(table.organizationId, table.date)
  ]
)

// ----------------------
// Drizzle Relations
// ----------------------

export const weeklyAvailabilityTemplatesRelations = relations(weeklyAvailabilityTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [weeklyAvailabilityTemplates.organizationId],
    references: [organizations.id]
  }),
  user: one(authUsers, {
    fields: [weeklyAvailabilityTemplates.userId],
    references: [authUsers.id]
  })
}))

export const availabilityExceptionsRelations = relations(availabilityExceptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [availabilityExceptions.organizationId],
    references: [organizations.id]
  }),
  user: one(authUsers, {
    fields: [availabilityExceptions.userId],
    references: [authUsers.id]
  })
}))
