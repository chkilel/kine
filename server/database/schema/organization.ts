import { v7 as uuidv7 } from 'uuid'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { creationAndUpdateTimestamps } from './columns.helpers'
import { users } from './auth'
import type {
  OrgContact,
  OrgAddress,
  OrgLegalRep,
  OrgFiscal,
  OrgBanking,
  OrgPricing,
  OrgScheduling,
  OrgClinical,
  OrgNotifications,
  OrgIntake,
  OrgBranding
} from '~~/shared/types/org.types'

/** ================================================================
 * ORGANIZATION SCHEMA
 * ================================================================
 * Defines organizations, members, invitations, and teams.
 */

// Organization table
export const organizations = sqliteTable('organizations', {
  id: text().primaryKey().$defaultFn(uuidv7),
  name: text().notNull(),
  slug: text().notNull().unique(),
  logo: text(),
  type: text(),
  description: text(),
  status: text().default('active'),
  timezone: text().default('Africa/Casablanca'),
  contact: text({ mode: 'json' }).$type<OrgContact>(),
  address: text({ mode: 'json' }).$type<OrgAddress>(),
  legalRepresentative: text({ mode: 'json' }).$type<OrgLegalRep>(),
  fiscal: text({ mode: 'json' }).$type<OrgFiscal>(),
  banking: text({ mode: 'json' }).$type<OrgBanking>(),
  pricing: text({ mode: 'json' }).$type<OrgPricing>(),
  scheduling: text({ mode: 'json' }).$type<OrgScheduling>(),
  clinical: text({ mode: 'json' }).$type<OrgClinical>(),
  notifications: text({ mode: 'json' }).$type<OrgNotifications>(),
  intake: text({ mode: 'json' }).$type<OrgIntake>(),
  branding: text({ mode: 'json' }).$type<OrgBranding>(),
  metadata: text({ mode: 'json' }),
  ...creationAndUpdateTimestamps
})

// Member table
export const members = sqliteTable('members', {
  id: text().primaryKey().$defaultFn(uuidv7),
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
  id: text().primaryKey().$defaultFn(uuidv7),
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
  id: text().primaryKey().$defaultFn(uuidv7),
  name: text().notNull(),
  organizationId: text()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  ...creationAndUpdateTimestamps
})

// Team members table (optional)
export const teamMembers = sqliteTable('team_members', {
  id: text().primaryKey().$defaultFn(uuidv7),
  teamId: text()
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...creationAndUpdateTimestamps
})
