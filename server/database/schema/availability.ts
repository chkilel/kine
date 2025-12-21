import { createId } from '@paralleldrive/cuid2'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { timestamps } from './columns.helpers'
import { organizations } from './organization'
import { users as authUsers } from './auth'

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
    id: text().primaryKey().$defaultFn(createId), // Unique template ID — e.g., "tpl_01HXYZ1234"
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }), // Foreign key to organization
    userId: text()
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }), // Foreign key to user

    // ---- Weekly schedule fields ----
    dayOfWeek: text({ enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }).notNull(), // Day of week — e.g., 'Mon'
    startTime: text().notNull(), // Start time in HH:MM format — e.g., '09:00'
    endTime: text().notNull(), // End time in HH:MM format — e.g., '12:00'
    location: text({ enum: ['clinic', 'home', 'telehealth'] }).notNull(), // Consultation location — e.g., 'clinic'
    maxSessions: integer().notNull().default(1), // Maximum simultaneous sessions — e.g., 4

    // Created and Updated timestamp
    ...timestamps
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
    id: text().primaryKey().$defaultFn(createId), // Unique exception ID — e.g., "exc_01HXYZ5678"
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }), // Foreign key to organization
    userId: text()
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }), // Foreign key to user

    // ---- Exception fields ----
    date: text().notNull(), // YYYY-MM-DD (date-only)
    startTime: text(), // Optional start time for partial day exceptions — e.g., '09:00'
    endTime: text(), // Optional end time for partial day exceptions — e.g., '12:00'
    isAvailable: integer({ mode: 'boolean' }).notNull(), // Whether available during this exception — e.g., false for vacation
    reason: text({
      enum: ['vacation', 'holiday', 'sick', 'training', 'meeting', 'personal', 'reduced_hours', 'other']
    }), // Reason for exception — e.g., 'vacation'

    // Created and Updated timestamp
    ...timestamps
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
