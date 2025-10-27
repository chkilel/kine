import { nanoid } from 'nanoid'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { timestamps, timestampsSoftDelete } from './columns.helpers'
import { organizations, teams } from './organization'

export const users = sqliteTable('users', {
  id: text().primaryKey().$defaultFn(nanoid),
  firstName: text().notNull(),
  lastName: text(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: 'boolean' })
    .notNull()
    .$default(() => false),
  image: text(),
  ...timestampsSoftDelete
})

export const sessions = sqliteTable('sessions', {
  id: text().primaryKey().$defaultFn(nanoid),
  token: text().notNull().unique(),
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  activeOrganizationId: text().references(() => organizations.id, { onDelete: 'cascade' }),
  activeTeamId: text().references(() => teams.id, { onDelete: 'cascade' }),
  ...timestamps
})

export const accounts = sqliteTable('accounts', {
  id: text().primaryKey().$defaultFn(nanoid),
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
  ...timestamps
})

export const verifications = sqliteTable('verifications', {
  id: text().primaryKey().$defaultFn(nanoid),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
  ...timestamps
})
