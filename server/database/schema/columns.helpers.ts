import { integer, text } from 'drizzle-orm/sqlite-core'

/**
 * ================================================================
 * COLUMN HELPERS
 * ================================================================
 * Reusable column definitions for database schemas.
 */

// CreatedAt, UpdatedAt timestamps
export const creationAndUpdateTimestamps = {
  createdAt: integer({ mode: 'timestamp_ms' })
    .$default(() => new Date())
    .notNull(),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .$default(() => new Date())
    .$onUpdateFn(() => new Date())
}

// CreatedAt, UpdatedAt, DeletedAt timestamps for soft deletion
export const softDeleteTimestamps = {
  ...creationAndUpdateTimestamps,
  deletedAt: integer({ mode: 'timestamp_ms' })
}

// YYYY-MM-DD date field, stored as TEXT
export const calendarDateField = () => text() // YYYY-MM-DD (date-only)
