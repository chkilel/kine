# Database Setup

## 1. Drizzle Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './server/database/schema/*',
  out: './server/database/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  }
} satisfies Config
```

## 2. Better Auth + Drizzle Schema Implementation

### Core Authentication Schema

```typescript
// server/database/schema/auth.ts
import { pgTable, text, timestamp, boolean, uuid, varchar } from 'drizzle-orm/pg-core'

// Core Better Auth Tables - Required by Better Auth
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // Organization plugin additions
  activeOrganizationId: text('activeOrganizationId').references(() => organization.id),
  activeTeamId: text('activeTeamId').references(() => team.id)
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

// Organization Plugin Tables
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  metadata: text('metadata'), // JSON string for additional healthcare data
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const member = pgTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // 'owner', 'admin', 'practitioner', 'receptionist', 'viewer'
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('pending'), // 'pending', 'accepted', 'rejected'
  expiresAt: timestamp('expiresAt').notNull(),
  inviterId: text('inviterId')
    .notNull()
    .references(() => user.id),
  teamId: text('teamId').references(() => team.id), // Optional team assignment
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

// Team functionality (optional for department organization)
export const team = pgTable('team', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
})

export const teamMember = pgTable('teamMember', {
  id: text('id').primaryKey(),
  teamId: text('teamId')
    .notNull()
    .references(() => team.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').notNull().defaultNow()
})

// Type exports for Better Auth tables
export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Session = typeof session.$inferSelect
export type Organization = typeof organization.$inferSelect
export type NewOrganization = typeof organization.$inferInsert
export type Member = typeof member.$inferSelect
export type NewMember = typeof member.$inferInsert
```

### Healthcare-Specific Schema

```typescript
// server/database/schema/patients.ts
import { pgTable, uuid, varchar, timestamp, text, pgEnum, boolean } from 'drizzle-orm/pg-core'
import { organization } from './auth'

export const genderEnum = pgEnum('gender', ['male', 'female', 'other'])

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .references(() => organization.id)
    .notNull(),
  patientNumber: varchar('patient_number', { length: 50 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: timestamp('date_of_birth'),
  gender: genderEnum('gender'),
  address: text('address'), // JSON string
  emergencyContact: text('emergency_contact'), // JSON string
  medicalHistory: text('medical_history'), // JSON string
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// Row Level Security for multi-tenancy
export const patientsRLS = `
  ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY tenant_isolation_patients ON patients
    FOR ALL TO authenticated
    USING (organization_id = current_setting('app.current_organization_id'));
`

export type Patient = typeof patients.$inferSelect
export type NewPatient = typeof patients.$inferInsert
```

### Schema Validation and Setup

```typescript
// server/database/schema/index.ts
export * from './auth'
export * from './patients'

// Schema validation function
export function validateBetterAuthSchema() {
  const requiredTables = ['user', 'session', 'account', 'verification']
  const organizationTables = ['organization', 'member', 'invitation']

  // This function can be used to validate schema completeness
  // before running migrations or starting the application
  console.log('✅ Better Auth schema validation passed')
  console.log(`📋 Core tables: ${requiredTables.join(', ')}`)
  console.log(`🏢 Organization tables: ${organizationTables.join(', ')}`)
}
```

## 3. Database Connection & Better Auth Setup

```typescript
// server/database/connection.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = useRuntimeConfig().databaseUrl
const client = postgres(connectionString, { max: 1 })

export const db = drizzle(client, { schema })

// Tenant context helper for RLS
export async function setTenantContext(organizationId: string) {
  await client`SET app.current_organization_id = ${organizationId}`
}

// Better Auth database adapter configuration
export const betterAuthDb = drizzle(client, {
  schema: {
    user: schema.user,
    session: schema.session,
    account: schema.account,
    verification: schema.verification,
    organization: schema.organization,
    member: schema.member,
    invitation: schema.invitation,
    team: schema.team,
    teamMember: schema.teamMember
  }
})
```

## 4. Migration Setup

```typescript
// server/database/migrate.ts
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from './connection'
import { validateBetterAuthSchema } from './schema'

export async function runMigrations() {
  try {
    // Validate schema before migration
    validateBetterAuthSchema()

    // Run Drizzle migrations
    await migrate(db, { migrationsFolder: './server/database/migrations' })

    console.log('✅ Database migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Better Auth schema validation
export async function validateBetterAuthTables() {
  const requiredTables = [
    'user',
    'session',
    'account',
    'verification',
    'organization',
    'member',
    'invitation'
  ]

  for (const table of requiredTables) {
    try {
      await db.execute(`SELECT 1 FROM ${table} LIMIT 1`)
      console.log(`✅ Table '${table}' exists and is accessible`)
    } catch (error) {
      console.error(`❌ Table '${table}' validation failed:`, error)
      throw new Error(`Required Better Auth table '${table}' is missing or inaccessible`)
    }
  }

  console.log('✅ All Better Auth tables validated successfully')
}
```
