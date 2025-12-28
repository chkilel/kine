import { v7 as uuidv7 } from 'uuid'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { creationAndUpdateTimestamps, softDeleteTimestamps } from './columns.helpers'
import { organizations, teams } from './organization'

/**
 * ================================================================
 * USERS TABLE
 * ================================================================
 * Stores user profiles and related information.
 */

export const users = sqliteTable('users', {
  id: text().primaryKey().$defaultFn(uuidv7),
  firstName: text().notNull(),
  lastName: text(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: 'boolean' }).notNull().default(false),
  image: text(),
  licenseNumber: text(),
  defaultConsultationDuration: integer().default(30),
  consultationGapMinutes: integer().default(5),
  slotIncrementMinutes: integer().default(15),
  specialization: text({ mode: 'json' }).$type<string[]>().default([]),
  phoneNumbers: text({ mode: 'json' }).$type<{ number: string; category: string; id: string }[]>().default([]),
  ...softDeleteTimestamps
})

export const sessions = sqliteTable('sessions', {
  id: text().primaryKey().$defaultFn(uuidv7),
  token: text().notNull().unique(),
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  activeOrganizationId: text().references(() => organizations.id, { onDelete: 'cascade' }),
  activeTeamId: text().references(() => teams.id, { onDelete: 'cascade' }),
  ...creationAndUpdateTimestamps
})

export const accounts = sqliteTable('accounts', {
  id: text().primaryKey().$defaultFn(uuidv7),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: integer({ mode: 'timestamp_ms' }),
  refreshTokenExpiresAt: integer({ mode: 'timestamp_ms' }),
  scope: text(),
  password: text(),
  ...creationAndUpdateTimestamps
})

export const verifications = sqliteTable('verifications', {
  id: text().primaryKey().$defaultFn(uuidv7),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
  ...creationAndUpdateTimestamps
})
