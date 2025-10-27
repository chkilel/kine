import { nanoid } from 'nanoid'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { timestamps } from './columns.helpers'
import { users } from './auth'

// Organization table
export const organizations = sqliteTable('organizations', {
  id: text().primaryKey().$defaultFn(nanoid),
  name: text().notNull(),
  slug: text().notNull().unique(),
  logo: text(),
  metadata: text({ mode: 'json' }),
  ...timestamps
})

// Member table
export const members = sqliteTable('members', {
  id: text().primaryKey().$defaultFn(nanoid),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text().notNull().default('member'),
  ...timestamps
})

// Invitation table
export const invitations = sqliteTable('invitations', {
  id: text().primaryKey().$defaultFn(nanoid),
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
  ...timestamps
})

// Teams table (optional)
export const teams = sqliteTable('teams', {
  id: text().primaryKey().$defaultFn(nanoid),
  name: text().notNull(),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  ...timestamps
})

// Team members table (optional)
export const teamMembers = sqliteTable('teamMembers', {
  id: text().primaryKey().$defaultFn(nanoid),
  teamId: text()
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps
})
