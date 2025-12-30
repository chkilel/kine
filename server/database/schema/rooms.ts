import { v7 as uuidv7 } from 'uuid'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

import { softDeleteTimestamps } from './columns.helpers'
import { organizations } from './organization'

/**
 * ================================================================
 * ROOMS TABLE
 * ================================================================
 * Stores treatment room information for clinics.
 * A room always belongs to one organization (clinic).
 * Records are soft-deleted for audit and data retention compliance.
 */
export const rooms = sqliteTable(
  'rooms',
  {
    id: text().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // Room information
    name: text().notNull(),
    description: text(),
    equipment: text({ mode: 'json' }).$type<string[]>().default([]),

    // Room properties
    capacity: integer().notNull().default(1),
    area: integer(),
    prm: integer().notNull().default(0),

    // Created, Updated and Soft-delete timestamp (null if active)
    ...softDeleteTimestamps
  },
  (table) => [
    index('idx_rooms_org_name').on(table.organizationId, table.deletedAt, table.name),
    index('idx_rooms_org_created').on(table.organizationId, table.deletedAt, table.createdAt),
    index('idx_rooms_org_deleted').on(table.organizationId, table.deletedAt)
  ]
)

export const roomsRelations = relations(rooms, ({ one }) => ({
  organization: one(organizations, {
    fields: [rooms.organizationId],
    references: [organizations.id]
  })
}))
