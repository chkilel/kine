import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core'
import { organization, user } from './auth'
import { patients } from './patients'

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .references(() => organization.id)
    .notNull(),
  patientId: uuid('patient_id')
    .references(() => patients.id)
    .notNull(),
  practitionerId: text('practitioner_id')
    .references(() => user.id)
    .notNull(),
  title: varchar('title', { length: 200 }),
  description: text('description'),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const appointmentsRLS = `
  ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY tenant_isolation_appointments ON appointments
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id'));
`
