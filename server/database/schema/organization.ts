import { createId } from '@paralleldrive/cuid2'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { creationAndUpdateTimestamps } from './columns.helpers'
import { users } from './auth'

/** ================================================================
 * ORGANIZATION SCHEMA
 * ================================================================
 * Defines organizations, members, invitations, and teams.
 */

// Organization table
export const organizations = sqliteTable('organizations', {
  id: text().primaryKey().$defaultFn(createId),
  name: text().notNull(),
  slug: text().notNull().unique(),
  logo: text(),
  metadata: text({ mode: 'json' }),
  ...creationAndUpdateTimestamps
})

// Member table
export const members = sqliteTable('members', {
  id: text().primaryKey().$defaultFn(createId),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text().notNull().default('member'),
  ...creationAndUpdateTimestamps
})

// Invitation table
export const invitations = sqliteTable('invitations', {
  id: text().primaryKey().$defaultFn(createId),
  email: text().notNull(),
  inviterId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  role: text().notNull().default('member'),
  status: text().notNull().default('pending'), // pending, accepted, expired
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
  teamId: text(), // Optional team ID for team-based invitations
  ...creationAndUpdateTimestamps
})

// Teams table (optional)
export const teams = sqliteTable('teams', {
  id: text().primaryKey().$defaultFn(createId),
  name: text().notNull(),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  ...creationAndUpdateTimestamps
})

// Team members table (optional)
export const teamMembers = sqliteTable('teamMembers', {
  id: text().primaryKey().$defaultFn(createId),
  teamId: text()
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...creationAndUpdateTimestamps
})
